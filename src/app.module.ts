//apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastapiService } from './services/fastapi.service';
import { ProductsController } from './product/products.controller';
import { ProductsService } from './product/products.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { PaymentsController } from './payments/payments.controller';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AppController, ProductsController, OrdersController, PaymentsController],
  providers: [AppService, FastapiService, ProductsService, OrdersService],
})
export class AppModule {}