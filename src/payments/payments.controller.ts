import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { FastapiService } from '../services/fastapi.service';

type CreateCheckoutBody = {
  orderId: string;
  provider?: 'stripe';
};

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly fastapiService: FastapiService,
  ) {}

  @Post('checkout')
  async createCheckout(
    @Body() body: CreateCheckoutBody,
    @Headers('authorization') authorization?: string,
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    const provider = body.provider || 'stripe';

    if (provider !== 'stripe') {
      throw new BadRequestException('Unsupported payment provider');
    }

    const order = await this.ordersService.getMyOrderById(
      body.orderId,
      authorization,
    );

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.payment_status === 'paid') {
      throw new BadRequestException('Order is already paid');
    }

    const response = await this.fastapiService.post('/create-payment', {
      order_id: order.id,
      provider: 'stripe',
    });

    return {
      success: true,
      provider: 'stripe',
      orderId: order.id,
      checkout: response,
    };
  }

  @Post('confirm')
  async confirmPayment(
    @Body() body: { orderId: string; provider?: string; paymentId?: string },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    const updated = await this.ordersService.markOrderPaid(
      body.orderId,
      body.provider || 'stripe',
      body.paymentId || null,
    );

    return {
      success: true,
      order: updated,
    };
  }
}