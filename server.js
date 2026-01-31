// Load environment variables
require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'playerdata.json');

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verify Stripe is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  process.exit(1);
}

console.log('Stripe configured successfully!');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ coins: 100 }));
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoints
  if (req.url === '/api/coins' && req.method === 'GET') {
    // Load coins
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (req.url === '/api/coins' && req.method === 'POST') {
    // Save coins
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify({ coins: data.coins }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, coins: data.coins }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid data' }));
      }
    });
    return;
  }

  if (req.url === '/api/create-checkout-session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { coinPackage } = JSON.parse(body);

        // Define coin packages
        const packages = {
          small: { coins: 500, price: 499, name: 'Small Coin Pack' },
          medium: { coins: 1200, price: 999, name: 'Medium Coin Pack' },
          large: { coins: 2500, price: 1999, name: 'Large Coin Pack' },
          mega: { coins: 6000, price: 4999, name: 'Mega Coin Pack' },
        };

        const pack = packages[coinPackage];
        if (!pack) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid package' }));
          return;
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: pack.name,
                  description: `${pack.coins} coins for ShatterRealms`,
                },
                unit_amount: pack.price,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `http://localhost:${PORT}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `http://localhost:${PORT}/?canceled=true`,
          metadata: {
            coins: pack.coins,
          },
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: session.url }));
      } catch (error) {
        console.error('Stripe error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  if (req.url === '/api/verify-session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { sessionId } = JSON.parse(body);

        if (!sessionId || typeof sessionId !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing or invalid session ID' }));
          return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payment not completed' }));
          return;
        }

        const coins = parseInt(session.metadata.coins, 10);

        if (!coins || coins <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid coin metadata' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ coins }));
      } catch (error) {
        console.error('Session verification error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid session' }));
      }
    });
    return;
  }

  if (req.url === '/api/stripe-config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      })
    );
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/public/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const extname = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentTypes[extname] || 'text/plain' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Game: http://localhost:${PORT}/`);
});
