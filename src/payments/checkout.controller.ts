import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { SupabaseService } from '../supabase/supabase.service';
import { StripeService } from './stripe.service';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly ordersService: OrdersService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async createCheckout(
    @Body() body: { orderId: string },
    @Headers('authorization') authorization?: string,
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    const { dbUser } = await this.supabaseService.getAuthenticatedUser(authorization);
    const order = await this.ordersService.getOrderById(body.orderId);

    if (order.user_id !== dbUser.id) {
      throw new BadRequestException('Order does not belong to this user');
    }

    if (order.payment_status === 'paid') {
      throw new BadRequestException('Order is already paid');
    }

    const totalAmount = Number(order.total_amount || 0);
    if (totalAmount <= 0) {
      throw new BadRequestException('Invalid order total');
    }

    const appUrl =
      this.configService.get<string>('SITE_URL_PROD') ||
      this.configService.get<string>('NEXT_PUBLIC_APP_URL') ||
      'https://dbaronx.com';

    const session = await this.stripeService.client.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: String(order.currency || 'usd').toLowerCase(),
            product_data: {
              name: `dBaronX Order ${order.order_number || order.id}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel?order_id=${order.id}`,
      metadata: {
        orderId: order.id,
        userId: dbUser.id,
        orderNumber: order.order_number || '',
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      orderId: order.id,
    };
  }
}