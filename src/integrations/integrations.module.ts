import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { CjService } from './cj.service';
import { OrderSyncController } from './order-sync.controller';

@Module({
  imports: [OrdersModule],
  providers: [CjService],
  controllers: [OrderSyncController],
  exports: [CjService],
})
export class IntegrationsModule {}