import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('me')
  async getMyOrders(@Headers('authorization') authorization?: string) {
    return this.ordersService.getMyOrders(authorization);
  }

  @Get('me/:id')
  async getMyOrderById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.ordersService.getOrderByIdForUser(id, authorization);
  }

  @Post()
  async createOrder(
    @Body()
    body: {
      productId: string;
      quantity: number;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      shippingAddress1: string;
      shippingAddress2?: string;
      shippingCity: string;
      shippingState?: string;
      shippingPostalCode?: string;
      shippingCountry: string;
      notes?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    return this.ordersService.createOrder(body, authorization);
  }
}