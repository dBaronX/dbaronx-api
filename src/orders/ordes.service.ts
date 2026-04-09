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
    const stamp = `${now.getUTCFullYear()}${String(
      now.getUTCMonth() + 1,
    ).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}${String(
      now.getUTCHours(),
    ).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(
      now.getUTCSeconds(),
    ).padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `DBX-${stamp}-${rand}`;
  }

  async getMyOrders(authorization?: string) {
    const { dbUser } = await this.supabaseService.getAuthenticatedUser(
      authorization,
    );

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

  async getMyOrderById(orderId: string, authorization?: string) {
    const { dbUser } = await this.supabaseService.getAuthenticatedUser(
      authorization,
    );

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

  async createOrder(input: CreateOrderInput, authorization?: string) {
    const { dbUser } = await this.supabaseService.getAuthenticatedUser(
      authorization,
    );

    if (!input.productId) {
      throw new BadRequestException('productId is required');
    }

    if (!input.quantity || input.quantity <= 0) {
      throw new BadRequestException('quantity must be greater than 0');
    }

    const { data: product, error: productError } =
      await this.supabaseService.admin
        .from('products')
        .select('*')
        .eq('id', input.productId)
        .eq('is_active', true)
        .single();

    if (productError || !product) {
      throw new NotFoundException('Product not found');
    }

    const quantity = Number(input.quantity);
    const unitPrice = Number(product.price || 0);

    if (unitPrice <= 0) {
      throw new BadRequestException('Invalid product price');
    }

    const subtotal = unitPrice * quantity;
    const shippingAmount = 0;
    const taxAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount;

    const metadata = {
      items: [
        {
          product_id: product.id,
          product_name: product.name,
          slug: product.slug,
          sku: product.sku,
          quantity,
          unit_price: unitPrice,
          supplier_source: product.supplier_source || null,
          supplier_product_id:
            product.supplier_product_id ||
            product.cj_product_id ||
            product.aliexpress_product_id ||
            product.woocommerce_product_id ||
            null,
        },
      ],
      checkout_mode: 'cash_first_manual_fulfillment',
    };

    const insertPayload = {
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
      supplier_source: product.supplier_source || null,
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
      metadata,
    };

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create order: ${error?.message || 'unknown'}`);
    }

    return data;
  }

  async markOrderPaid(
    orderId: string,
    paymentProvider: string,
    paymentSessionId?: string | null,
  ) {
    const order = await this.getOrderById(orderId);

    const mergedMetadata = {
      ...(order.metadata || {}),
      payment_provider: paymentProvider,
      payment_session_id: paymentSessionId || null,
      paid_at_gateway: new Date().toISOString(),
    };

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: mergedMetadata,
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to mark order paid: ${error?.message || 'unknown'}`,
      );
    }

    return data;
  }

  async markSupplierOrdered(
    orderId: string,
    payload: {
      supplierSource: string;
      supplierOrderId?: string;
      trackingNumber?: string;
      shippingProvider?: string;
      notes?: string;
    },
  ) {
    const order = await this.getOrderById(orderId);

    const mergedMetadata = {
      ...(order.metadata || {}),
      manual_fulfillment_updated_at: new Date().toISOString(),
      manual_fulfillment_notes: payload.notes || null,
    };

    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .update({
        supplier_source: payload.supplierSource,
        supplier_order_id: payload.supplierOrderId || null,
        tracking_number: payload.trackingNumber || null,
        shipping_provider: payload.shippingProvider || null,
        fulfillment_status: 'supplier_ordered',
        status: 'processing',
        metadata: mergedMetadata,
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to mark supplier ordered: ${error?.message || 'unknown'}`,
      );
    }

    return data;
  }

  async addTracking(
    orderId: string,
    payload: {
      trackingNumber: string;
      shippingProvider?: string;
    },
  ) {
    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .update({
        tracking_number: payload.trackingNumber,
        shipping_provider: payload.shippingProvider || null,
        fulfillment_status: 'supplier_shipped',
        status: 'shipped',
        shipped_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to add tracking: ${error?.message || 'unknown'}`);
    }

    return data;
  }

  async getAwaitingFulfillmentOrders() {
    const { data, error } = await this.supabaseService.admin
      .from('orders')
      .select('*')
      .eq('payment_status', 'paid')
      .in('fulfillment_status', ['awaiting_supplier_order', 'needs_manual_review'])
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch awaiting fulfillment orders: ${error.message}`,
      );
    }

    return data ?? [];
  }
}