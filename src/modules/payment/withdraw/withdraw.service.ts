import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { UpdateWithdrawDto } from './dto/update-withdraw.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Injectable()
export class WithdrawService {

  constructor(
    private readonly prisma: PrismaService
  ) {}

  // Stripe Account Connect
  async createStripeConnectAccount(
    userId: string,
    email: string) {

    // create stripe connect account
    if (!userId) {
      throw new BadRequestException('Invalid user id for Stripe Connect creation');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if(user.stripe_connect_id) {
      throw new BadRequestException('Stripe Connect account already exists');
    }

    try {
      const CreateAccountResult = await StripePayment.createConnectedAccount(email);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripe_connect_id: CreateAccountResult.id
        }
      });

      return {
        status:true,
        message: 'Stripe Connect account created successfully',
        data: CreateAccountResult
      };
    } catch (error: any) {
      throw new BadRequestException(`Stripe Connect account creation failed: ${error?.message ?? 'Unknown error'}`);
    }
  }

  // Stripe Connect Onboarding Linkq
  async createStripeOnboardingLink(
    accountId: string
  ) {

    try {
      const onboardingLinkResult = await StripePayment.createOnboardingAccountLink(accountId);

      return {
        status:true,
        message: 'Stripe Onboarding link created successfully',
        data: onboardingLinkResult
      };
    } catch (error: any) {
      throw new BadRequestException(`Stripe Onboarding link creation failed: ${error?.message ?? 'Unknown error'}`);
    }
  }
  
  // Withdraw Request
  async createWithdrawRequest(
    userId: string,
    createWithdrawDto: CreateWithdrawDto
  ) {

    const { amount, currency = 'usd' } = createWithdrawDto; 

    if (!userId) {
      throw new BadRequestException('Invalid user id for withdrawal');
    }
 
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if(!user.stripe_connect_id) {
      throw new BadRequestException('Stripe Connect account not found');
    }

    if(!user.balance || user.balance.toNumber() < amount) {
      throw new BadRequestException('Insufficient balance for withdrawal');
    }

    if (amount < 20) {
      throw new BadRequestException('Minimum withdraw amount is 20 USD');
    }

    try {
      const transfer = await StripePayment.createTransfer(
        user.stripe_connect_id, 
        amount, 
        currency
      );

      // Deduct user balance
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: amount }
        }
      });

      await this.prisma.paymentTransaction.create({
          data: {
            user_id: userId,
            type: 'withdraw',
            withdraw_via: 'stripe',
            provider: 'stripe',
            reference_number: transfer.id,
            status: 'completed',
            amount: amount,
            currency: currency,
            paid_amount: amount,
            paid_currency: currency,
          },
        });

      return {
        success: true,
        message: 'Withdraw request created successfully',
        data: {
          transfer_id: transfer.id,
          amount: amount,
          currency: currency,
          status: "completed",
        }
      };
    } catch (error: any) {
      
       let errorMessage = 'Failed to process withdraw. Please try again later.';

      if (error?.code === 'balance_insufficient') {
        errorMessage =
          'Stripe account have not enough balance. Please try again later.';
      }

      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get Connected Account Balance
  async getConnectedAccountBalance(
    userId: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripe_connect_id: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if(!user.stripe_connect_id) {
      throw new BadRequestException('Stripe Connect account not found');
    }
    try{
      const balance = await StripePayment.checkBalance(user.stripe_connect_id);

      const availableBalance = balance.available.reduce((total, bal) => total + bal.amount, 0);
      const pendingBalance = balance.pending.reduce((total, bal) => total + bal.amount, 0);
      const currency = balance.available.length > 0 ? balance.available[0].currency : 'usd';

      return {
        success: true,
        message: 'Connected account balance retrieved successfully',
        data: { 
        available: availableBalance,
        pending: pendingBalance,
        currency: currency
        }
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to retrieve account balance: ${error?.message ?? 'Unknown error'}`);
    }
  }

  // Withdraw History
  async getWithdrawHistory(
    userId: string
  ) {
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: {
        user_id: userId,
        type: 'withdraw'
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    return transactions;
  }

   // Account Info
  async getAccountInfo(
    userId: string
  ) {
    const user =  await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripe_connect_id: true,
        balance: true
      }
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      message: 'Account info retrieved successfully',
      data: user
    }
  }




}