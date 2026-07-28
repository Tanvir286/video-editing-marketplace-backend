import { Module } from '@nestjs/common';
import { StripeModule } from './stripe/stripe.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { DepositeModule } from './deposite/deposite.module';

@Module({
  imports: [StripeModule, WithdrawModule, DepositeModule],
})
export class PaymentModule {}
