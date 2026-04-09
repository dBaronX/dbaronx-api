import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProducts(query?: {
    category?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
  }) {
    let qb = this.supabaseService.admin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (query?.category) {
      qb = qb.eq('category', query.category);
    }

    if (query?.featured) {
      qb = qb.eq('is_featured', true);
    }

    if (query?.search) {
      qb = qb.or(
        `name.ilike.%${query.search}%,short_description.ilike.%${query.search}%,description.ilike.%${query.search}%`,
      );
    }

    if (query?.limit && query.limit > 0) {
      qb = qb.limit(query.limit);
    }

    const { data, error } = await qb;
    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data ?? [];
  }

  async getProductBySlug(slug: string) {
    const { data, error } = await this.supabaseService.admin
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException('Product not found');
    }

    return data;
  }
}