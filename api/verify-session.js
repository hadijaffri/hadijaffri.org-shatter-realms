import Stripe from 'stripe';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid session ID' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const coins = parseInt(session.metadata.coins, 10);

    if (!coins || coins <= 0) {
      return res.status(400).json({ error: 'Invalid coin metadata' });
    }

    return res.status(200).json({ coins });
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(400).json({ error: 'Invalid session' });
  }
}
