import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CheckoutController } from './payments/checkout.controller'
import { FastAPIService } from './integrations/fastapi.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, CheckoutController],
  providers: [AppService, FastAPIService],
})
export class AppModule {}