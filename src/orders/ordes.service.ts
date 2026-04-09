import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type CreateOrderInput = {
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
};

@Injectable()
export class OrdersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `DBX-${stamp}-${rand}`;
  }

  async getMyOrders(authHeader?: string) {
    const { dbUser } = await this.supabaseService.getAuthenticatedUser(authHeader);

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data ?? [];
  }

  async getOrderByIdForUser(orderId: string, authHeader?: string) {
    const { dbUser } = await this.supabaseService.getAuthenticatedUser(authHeader);

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', dbUser.id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Order not found');
    }

    return data;
  }

  async getOrderById(orderId: string) {
    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Order not found');
    }

    return data;
  }

  async createOrder(input: CreateOrderInput, authHeader?: string) {
    const { dbUser } = await this.supabaseService.getAuthenticatedUser(authHeader);

    if (!input.productId  !input.quantity  input.quantity <= 0) {
      throw new BadRequestException('Invalid product or quantity');
    }

    const { data: product, error: productError } = await this.supabaseService.admin
      .from('products')
      .select('*')
      .eq('id', input.productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      throw new NotFoundException('Product not found');
    }

    const quantity = input.quantity;
    const unitPrice = Number(product.price || 0);
    const subtotal = unitPrice * quantity;
    const shippingAmount = 0;
    const taxAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount;

    const payload = {
      user_id: dbUser.id,
      order_number: this.generateOrderNumber(),
      source: 'store',
      status: 'pending_payment',
      fulfillment_status: 'awaiting_supplier_order',
      payment_status: 'pending',
      currency: product.currency || 'USD',
      subtotal,
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      supplier_source:
        product.supplier_source || (product.cj_product_id ? 'cj' : 'woocommerce'),
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || null,
      customer_name: input.customerName,
      shipping_address_1: input.shippingAddress1,
      shipping_address_2: input.shippingAddress2 || null,
	  shipping_city: input.shippingCity,
      shipping_state: input.shippingState || null,
      shipping_postal_code: input.shippingPostalCode || null,
      shipping_country: input.shippingCountry,
      notes: input.notes || null,
      metadata: {
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            slug: product.slug,
            sku: product.sku,
            quantity,
            unit_price: unitPrice,
            supplier_source: product.supplier_source,
            supplier_product_id:
              product.cj_product_id ||
              product.woocommerce_product_id ||
              product.aliexpress_product_id ||
              product.supplier_product_id ||
              null,
          },
        ],
      },
    };

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create order: ${error?.message ?? 'unknown error'}`);
    }

    return data;
  }

  async markOrderPaid(orderId: string, paymentProvider: string, paymentSessionId?: string) {
    const order = await this.getOrderById(orderId);

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: {
          ...(order.metadata || {}),
          payment_provider: paymentProvider,
          payment_session_id: paymentSessionId || null,
        },
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to mark order paid: ${error?.message ?? 'unknown error'}`);
    }

    return data;
  }

  async updateSupplierSync(
    orderId: string,
    supplierSource: string,
    supplierOrderId: string,
    rawResponse?: unknown,
  ) {
    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .update({
        supplier_source: supplierSource,
        supplier_order_id: supplierOrderId,
        fulfillment_status: 'supplier_ordered',
        status: 'processing',
        metadata: {
          synced_at: new Date().toISOString(),
          supplier_response: rawResponse ?? null,
        },
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update supplier sync: ${error?.message ?? 'unknown error'}`);
    }

    return data;
  }
}