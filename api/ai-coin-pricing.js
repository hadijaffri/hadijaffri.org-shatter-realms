import Stripe from 'stripe';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Smart pricing algorithm (no AI dependency)
function calculateSmartPrice(coins) {
  const basePrice = coins / 100; // $1 per 100 coins

  // Volume discounts with smooth curve
  let discount = 0;
  if (coins >= 25000) discount = 0.3;
  else if (coins >= 10000) discount = 0.25;
  else if (coins >= 5000) discount = 0.2;
  else if (coins >= 2500) discount = 0.15;
  else if (coins >= 1000) discount = 0.1;
  else if (coins >= 500) discount = 0.05;

  // Add slight randomness for "AI-like" feel (within 2%)
  const variance = (Math.random() - 0.5) * 0.02;
  const finalDiscount = Math.max(0, discount + variance);

  const price = Math.max(0.5, Math.round(basePrice * (1 - finalDiscount) * 100) / 100);

  const reasons = [
    `Volume discount of ${Math.round(finalDiscount * 100)}% applied`,
    `Best value for ${coins} coins with ${Math.round(finalDiscount * 100)}% savings`,
    `Smart pricing: ${Math.round(finalDiscount * 100)}% off base rate`,
    `Optimized rate with ${Math.round(finalDiscount * 100)}% discount`,
  ];

  return {
    price,
    reasoning: reasons[Math.floor(Math.random() * reasons.length)],
  };
}

export default async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { coins } = req.body;

    if (!coins || coins < 50 || coins > 50000) {
      return res.status(400).json({
        error: 'Invalid coin amount. Must be between 50 and 50,000 coins.',
      });
    }

    // Calculate price with smart algorithm
    const priceData = calculateSmartPrice(coins);

    // Try to create Stripe session, but return price info even if it fails
    try {
      const priceInCents = Math.round(priceData.price * 100);

      // Create ephemeral Stripe product and price
      const product = await stripe.products.create({
        name: `${coins} Game Coins`,
        description: `Purchase of ${coins} coins for ShatterRealms`,
        metadata: {
          coins: coins.toString(),
          type: 'dynamic_coin_purchase',
        },
        active: true,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceInCents,
        currency: 'usd',
      });

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin || 'https://i-like-mangos.vercel.app'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'https://i-like-mangos.vercel.app'}?canceled=true`,
        metadata: {
          coins: coins.toString(),
        },
      });

      return res.status(200).json({
        url: session.url,
        coins: coins,
        price: priceData.price,
        reasoning: priceData.reasoning,
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError.message);
      // Still return the price calculation even if Stripe fails
      return res.status(200).json({
        url: null,
        coins: coins,
        price: priceData.price,
        reasoning: priceData.reasoning,
        stripeError: 'Payment temporarily unavailable, please try again',
      });
    }
  } catch (error) {
    console.error('AI Coin Pricing Error:', error);
    return res.status(500).json({
      error: 'Failed to process coin purchase',
      details: error.message,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    });
  }
}
