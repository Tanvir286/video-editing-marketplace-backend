import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateWithdrawDto } from './dto/update-withdraw.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}
  
  // Stripe Account Connect
  @Post('stripe-connect-account')
  async createStripeConnectAccount(@Req() req: any) {
    const userId = req.user.userId;
    const email = req.user.email;

    console.log(req.user);

    const result = await this.withdrawService.createStripeConnectAccount(
      userId,
      email,
    );

    return {
      success: true,
      message: 'Stripe Connect account created successfully',
      data: result,
    };
  }

  // Stripe Connect Onboarding Link
  @Post('onboarding/:accountId')
  async createStripeOnboardingLink(@Param('accountId') accountId: string) {
    const result =
      await this.withdrawService.createStripeOnboardingLink(accountId);

    return {
      success: true,
      message: 'Stripe Onboarding link created successfully',
      data: result,
    };
  }

  // Withdraw  Request
  @Post('request')
  async createWithdrawRequest(
    @Req() req: any,
    @Body() createWithdrawDto: CreateWithdrawDto,
  ) {
    const userId = req.user.id;

    const result = await this.withdrawService.createWithdrawRequest(
      userId,
      createWithdrawDto,
    );

    return {
      success: true,
      message: 'Withdraw request created successfully',
      data: result.data,
    };
  }

  

  //check Connect Account Balance
  @Get('account-balance')
  async getConnectedAccountBalance(@Req() req: any) {
    const userId = req.user.userId;
    const result =
      await this.withdrawService.getConnectedAccountBalance(userId);

    return {
      success: true,
      message: 'Connected account balance retrieved successfully',
      data: result,
    };
  }

  // withdraw history
  @Get('history')
  async getWithdrawHistory(@Req() req: any) {
    const userId = req.user.userId;
    const result = await this.withdrawService.getWithdrawHistory(userId);
    return {
      success: true,
      message: 'Withdraw history retrieved successfully',
      data: result,
    };
  }

  // account balance
  @Get('account-info')
  async getAccountBalance(@Req() req: any) {
    const userId = req.user.userId;
    return await this.withdrawService.getAccountInfo(userId);
    
  }


  
}

