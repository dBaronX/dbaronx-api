import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('me')
  async getMyOrders(@Headers('authorization') authorization?: string) {
    const orders = await this.ordersService.getMyOrders(authorization);
    return {
      success: true,
      count: orders.length,
      orders,
    };
  }

  @Get('me/:id')
  async getMyOrderById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const order = await this.ordersService.getMyOrderById(id, authorization);
    return {
      success: true,
      order,
    };
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
    const order = await this.ordersService.createOrder(body, authorization);
    return {
      success: true,
      order,
    };
  }

  @Get('admin/awaiting-fulfillment')
  async getAwaitingFulfillmentOrders() {
    const orders = await this.ordersService.getAwaitingFulfillmentOrders();
    return {
      success: true,
      count: orders.length,
      orders,
    };
  }

  @Patch('admin/:id/mark-supplier-ordered')
  async markSupplierOrdered(
    @Param('id') id: string,
    @Body()
    body: {
      supplierSource: string;
      supplierOrderId?: string;
      trackingNumber?: string;
      shippingProvider?: string;
      notes?: string;
    },
  ) {
    const order = await this.ordersService.markSupplierOrdered(id, body);
    return {
      success: true,
      order,
    };
  }

  @Patch('admin/:id/add-tracking')
  async addTracking(
    @Param('id') id: string,
    @Body()
    body: {
      trackingNumber: string;
      shippingProvider?: string;
    },
  ) {
    const order = await this.ordersService.addTracking(id, body);
    return {
      success: true,
      order,
    };
  }
}