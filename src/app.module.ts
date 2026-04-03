import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CheckoutController } from './payments/checkout.controller';
import { OrderSyncController } from './order-sync.controller';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), IntegrationsModule],
  controllers: [AppController, CheckoutController, OrderSyncController],
  providers: [AppService],
})
export class AppModule {}