// Vercel Serverless Function to provide Stripe public key
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
    // Enable CORS
    setCorsHeaders(res);

    if (handleOptions(req, res)) {
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
}
