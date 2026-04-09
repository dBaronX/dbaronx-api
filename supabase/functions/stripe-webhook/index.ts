import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
});
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req: Request) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Webhook signature verification failed", message: err.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle payment succeeded
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    const apiUrl = Deno.env.get("API_URL") ?? "";
    const fastapiUrl = Deno.env.get("FASTAPI_URL") ?? "";

    // Notify NestJS API for order sync + CJ dropshipping
    await fetch(`${apiUrl}/orders/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentMethod: "stripe", paymentId: paymentIntent.id }),
    });

    // Notify FastAPI for presale/dreams update
    await fetch(`${fastapiUrl}/payment/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        user: paymentIntent.metadata.user,
      }),
    });
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});