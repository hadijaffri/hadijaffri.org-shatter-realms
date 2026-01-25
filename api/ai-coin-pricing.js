import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { coins } = req.body;

        if (!coins || coins < 50 || coins > 50000) {
            return res.status(400).json({
                error: 'Invalid coin amount. Must be between 50 and 50,000 coins.'
            });
        }

        // Use Claude to determine fair pricing
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        const pricingPrompt = `You are a game monetization AI. Determine the fair USD price for ${coins} coins in a game.

Pricing guidelines:
- Base rate: $1.00 per 100 coins
- Volume discounts:
  - 500+ coins: 5% discount
  - 1000+ coins: 10% discount
  - 2500+ coins: 15% discount
  - 5000+ coins: 20% discount
  - 10000+ coins: 25% discount
  - 25000+ coins: 30% discount
- Minimum price: $0.50
- Round to nearest $0.01

Respond with ONLY a JSON object in this exact format:
{"price": X.XX, "reasoning": "brief explanation"}`;

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [{ role: 'user', content: pricingPrompt }]
        });

        let priceData;
        try {
            const responseText = response.content[0].text.trim();
            priceData = JSON.parse(responseText);
        } catch (e) {
            // Fallback pricing if AI response parsing fails
            const basePrice = coins / 100;
            let discount = 0;
            if (coins >= 25000) discount = 0.30;
            else if (coins >= 10000) discount = 0.25;
            else if (coins >= 5000) discount = 0.20;
            else if (coins >= 2500) discount = 0.15;
            else if (coins >= 1000) discount = 0.10;
            else if (coins >= 500) discount = 0.05;

            priceData = {
                price: Math.max(0.50, Math.round((basePrice * (1 - discount)) * 100) / 100),
                reasoning: 'Calculated with standard volume discount'
            };
        }

        const priceInCents = Math.round(priceData.price * 100);

        // Create ephemeral Stripe product and price
        const product = await stripe.products.create({
            name: `${coins} Game Coins`,
            description: `Purchase of ${coins} coins for ShatterRealms`,
            metadata: {
                coins: coins.toString(),
                type: 'dynamic_coin_purchase'
            },
            active: true
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: priceInCents,
            currency: 'usd'
        });

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: price.id,
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'https://i-like-mangos.vercel.app'}?success=true&coins=${coins}`,
            cancel_url: `${req.headers.origin || 'https://i-like-mangos.vercel.app'}?canceled=true`,
            metadata: {
                coins: coins.toString()
            }
        });

        return res.status(200).json({
            url: session.url,
            coins: coins,
            price: priceData.price,
            reasoning: priceData.reasoning
        });

    } catch (error) {
        console.error('AI Coin Pricing Error:', error);
        return res.status(500).json({ error: 'Failed to process coin purchase' });
    }
}
