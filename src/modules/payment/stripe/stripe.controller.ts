 import { Controller, Post, Req, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('payment/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private transactionRepository: TransactionRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {

      const payload = req.rawBody.toString();
      const event = await this.stripeService.handleWebhook(payload, signature);

      // Handle events
      switch (event.type) {
        case 'customer.created':
          break;
        case 'payment_intent.created':
          break;
        case 'payment_intent.succeeded': {

          const paymentIntent = event.data.object as any;
          const reference = paymentIntent.id as string;

          // Find existing transaction
          const tx = await this.prisma.paymentTransaction.findFirst({
            where: { reference_number: reference },
          });

          // If we don't find a transaction
          if (!tx) {
            await this.transactionRepository.updateTransaction({
              reference_number: reference,
              status: 'succeeded',
              paid_amount: paymentIntent.amount / 100,
              paid_currency: paymentIntent.currency,
              raw_status: paymentIntent.status,
            });
            break;
          }

          // Only process credit if transitioning to succeeded
          if (tx.status !== 'succeeded') {
            await this.transactionRepository.updateTransaction({
              reference_number: reference,
              status: 'succeeded',
              paid_amount: paymentIntent.amount / 100,
              paid_currency: paymentIntent.currency,
              raw_status: paymentIntent.status,
            });

            // If this is a deposit, credit user's balance
            if (tx.type === 'deposit' && tx.user_id) {
              await this.prisma.user.update({
                where: { id: tx.user_id },
                data: { balance: { increment: Number(paymentIntent.amount / 100) } },
              });
            }
          }
          break;
        }
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          console.log(paidPayout);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          console.log(failedPayout);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error', error);
      return { received: false };
    }
  }
}
