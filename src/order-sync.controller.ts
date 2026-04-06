import { Controller, Post, Body } from '@nestjs/common';

@Controller('orders')
export class OrderSyncController {
  @Post('sync')
  async syncOrder(@Body() body: { orderId: string; paymentId: string; provider: string }) {
    console.log('💰 Incoming paid order:', body);

    // TODO: Fetch real order from Medusa/Supabase
    const fakeOrder = {
      items: [{ cj_variant_id: "123456", quantity: 1 }],
      customer: {
        name: "Test User",
        country: "United Arab Emirates",
        province: "Dubai",
        city: "Dubai",
        address: "Test Address",
        zip: "00000",
        phone: "0000000000"
      },
    };

    // Send to CJdropshipping
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/order/createOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': process.env.CJ_API_KEY || '',
      },
      body: JSON.stringify({
        productList: fakeOrder.items.map(item => ({
          variantId: item.cj_variant_id,
          quantity: item.quantity,
        })),
        consignee: fakeOrder.customer,
        orderRemark: `Paid via ${body.provider} | ${body.paymentId}`,
      }),
    });

    const data = await response.json();
    console.log('✅ CJ Response:', data);
    return { success: true, cjOrder: data };
  }
}