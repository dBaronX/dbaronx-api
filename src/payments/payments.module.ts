import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { CheckoutController } from './checkout.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [OrdersModule],
  controllers: [CheckoutController, StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}