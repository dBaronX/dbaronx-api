import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CjService } from './cj.service';

@Controller('orders')
export class OrderSyncController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cjService: CjService,
  ) {}

  @Post('sync')
  async syncPaidOrder(
    @Body()
    body: {
      orderId: string;
    },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    const order = await this.ordersService.getOrderById(body.orderId);

    if (order.payment_status !== 'paid') {
      throw new BadRequestException('Order is not paid');
    }

    if (order.fulfillment_status !== 'awaiting_supplier_order') {
      throw new BadRequestException(
        Order cannot be synced in current state: ${order.fulfillment_status},
      );
    }

    const items = Array.isArray(order.metadata?.items) ? order.metadata.items : [];
    if (!items.length) {
      throw new BadRequestException('Order has no items in metadata');
    }

    const cjItems = items
      .map((item: any) => ({
        variantId:
          item.supplier_product_id ||
          item.cj_product_id ||
          item.vid ||
          null,
        quantity: Number(item.quantity || 1),
      }))
      .filter((item: { variantId: string | null }) => !!item.variantId);

    if (!cjItems.length) {
      throw new BadRequestException('Order has no CJ-mapped items');
    }

    const customerName = order.customer_name;
    const customerCountry = order.shipping_country;
    const customerCity = order.shipping_city;
    const customerAddress = [
      order.shipping_address_1,
      order.shipping_address_2,
    ]
      .filter(Boolean)
      .join(', ');

    if (!customerName  !customerCountry  !customerCity || !customerAddress) {
      throw new BadRequestException('Order shipping details are incomplete');
    }

    const cjResponse = await this.cjService.createOrder({
      orderId: order.order_number || order.id,
      items: cjItems,
      customer: {
        name: customerName,
        country: customerCountry,
        province: order.shipping_state,
        city: customerCity,
        address: customerAddress,
        zip: order.shipping_postal_code,
        phone: order.customer_phone,
        email: order.customer_email,
      },
    });

    const supplierOrderId =
      (cjResponse as any)?.data?.orderId ||
      (cjResponse as any)?.orderId ||
      (cjResponse as any)?.id ||
      null;

    if (!supplierOrderId) {
      throw new BadRequestException({
        message: 'CJ did not return a supplier order ID',
        response: cjResponse,
      });
    }

    const updated = await this.ordersService.updateSupplierSync(
      order.id,
      'cj',
      String(supplierOrderId),
      cjResponse,
    );

    return {
      message: 'Order synced to CJ successfully',
      order: updated,
      cjResponse,
    };
  }
}