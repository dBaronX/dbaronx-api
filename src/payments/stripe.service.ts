import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string | null;

  constructor(private readonly configService: ConfigService) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    const secretKey = isProd
      ? this.configService.get<string>('STRIPE_SECRET_KEY_LIVE')
      : this.configService.get<string>('STRIPE_SECRET_KEY_TEST');

    if (!secretKey) {
      throw new Error('Stripe secret key is missing');
    }

    this.webhookSecret = isProd
      ? this.configService.get<string>('STRIPE_WEBHOOK_SECRET_LIVE') || null
      : this.configService.get<string>('STRIPE_WEBHOOK_SECRET_TEST') || null;

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-03-31.dahlia',
    });
  }

  get client(): Stripe {
    return this.stripe;
  }

  get stripeWebhookSecret(): string | null {
    return this.webhookSecret;
  }
}