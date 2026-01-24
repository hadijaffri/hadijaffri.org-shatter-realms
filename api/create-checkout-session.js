// Vercel Serverless Function for Stripe Checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Enable CORS
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
        const { coinPackage } = req.body;

        // Define coin packages
        const packages = {
            small: { coins: 500, price: 499, name: 'Small Coin Pack' },
            medium: { coins: 1200, price: 999, name: 'Medium Coin Pack' },
            large: { coins: 2500, price: 1999, name: 'Large Coin Pack' },
            mega: { coins: 6000, price: 4999, name: 'Mega Coin Pack' }
        };

        const pack = packages[coinPackage];
        if (!pack) {
            return res.status(400).json({ error: 'Invalid package' });
        }

        // Get the base URL from the request headers
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: pack.name,
                        description: `${pack.coins} coins for ShatterRealms`,
                    },
                    unit_amount: pack.price,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${baseUrl}/?success=true&coins=${pack.coins}`,
            cancel_url: `${baseUrl}/?canceled=true`,
            metadata: {
                coins: pack.coins
            }
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        return res.status(500).json({ error: error.message });
    }
}
