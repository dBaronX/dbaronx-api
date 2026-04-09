import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
});

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { amount, currency, paymentMethod, orderId, email } = body;

    // Stripe Payment
    if (paymentMethod === "stripe") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { orderId },
      });

      return new Response(
        JSON.stringify({ clientSecret: paymentIntent.client_secret }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Paystack Payment
    if (paymentMethod === "paystack") {
      const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email || body.email,
          amount,
          currency,
          metadata: { orderId },
        }),
      });

      const data = await paystackRes.json();
      return new Response(
        JSON.stringify({ authorization_url: data.data?.authorization_url }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Solana Payment
    if (paymentMethod === "solana") {
      const solanaUrl = `solana:HBwQLU86RDcHp4Q2uFoH9YLVUP1xKRZCHeHJTS9C1JpW?amount=${amount}&label=dBaronX&message=Order ${orderId}`;
      return new Response(
        JSON.stringify({ solanaUrl }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid payment method" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});