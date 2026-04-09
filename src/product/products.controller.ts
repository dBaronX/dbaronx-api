import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('featured') featured?: string,
  ) {
    const products = await this.productsService.getProducts({
      search,
      category,
      featured: featured === 'true',
    });

    return {
      success: true,
      count: products.length,
      products,
    };
  }
}