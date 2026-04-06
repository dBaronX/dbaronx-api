//checkout.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import Stripe from 'stripe';

const isProd = process.env.NODE_ENV === 'production';
const stripeKey = isProd 
  ? process.env.STRIPE_SECRET_KEY_LIVE 
  : process.env.STRIPE_SECRET_KEY_TEST;

if (!stripeKey) throw new Error('❌ STRIPE KEY NOT FOUND IN ENV');

const stripe = new Stripe(stripeKey, { apiVersion: '2025-03-25.dahlia' });

@Controller('checkout')
export class CheckoutController {
  @Post()
  async createCheckout(@Body() body: { amount: number; orderId?: string; user?: string }) {
    if (!body.amount || body.amount <= 0) {
      throw new Error('Invalid amount');
    }

    const siteUrl = isProd 
      ? process.env.SITE_URL_PROD 
      : process.env.SITE_URL_LOCAL;

    if (!siteUrl) {
      throw new Error('❌ SITE URL NOT SET');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'dBaronX Product' },
          unit_amount: body.amount * 100,
        },
        quantity: 1,
      }],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      metadata: {
        orderId: body.orderId || '',
        user: body.user || '',
      },
    });

    return { url: session.url };
  }
}