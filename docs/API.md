# ShatterRealms API Documentation

This document describes all serverless API endpoints used by ShatterRealms.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

---

## Endpoints

### 1. Save Player Data

**Endpoint**: `POST /api/save`

**Description**: Saves player progress to cloud storage (currently in-memory for demo).

**Request Body**:
```json
{
  "coins": 1500,
  "ownedItems": ["sword", "fireball", "lightning_bow_abc123"]
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "coins": 1500,
  "ownedItems": ["sword", "fireball", "lightning_bow_abc123"]
}
```

**Response** (Error - 400):
```json
{
  "error": "Invalid data"
}
```

**Notes**:
- Currently uses in-memory storage (data lost on restart)
- Production should integrate with Vercel KV or a database
- No authentication required (identified by cookie device ID)

---

### 2. Get Player Data

**Endpoint**: `GET /api/save`

**Description**: Retrieves player progress from cloud storage.

**Response** (Success - 200):
```json
{
  "coins": 100,
  "ownedItems": ["sword", "fireball"]
}
```

**Notes**:
- Returns default starting data if no save exists
- Used on game load to restore progress

---

### 3. Create Stripe Checkout Session

**Endpoint**: `POST /api/create-checkout-session`

**Description**: Initiates a Stripe payment flow for purchasing predefined coin packages.

**Request Body**:
```json
{
  "coinPackage": "medium"
}
```

**Valid Packages**:
- `small`: 500 coins for $4.99
- `medium`: 1200 coins for $9.99
- `large`: 2500 coins for $19.99
- `mega`: 6000 coins for $49.99

**Response** (Success - 200):
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Response** (Error - 400):
```json
{
  "error": "Invalid package"
}
```

**Response** (Error - 500):
```json
{
  "error": "Detailed error message"
}
```

**Notes**:
- Redirects user to Stripe Checkout
- Success URL: `/?success=true&coins=1200`
- Cancel URL: `/?canceled=true`
- Requires `STRIPE_SECRET_KEY` environment variable

---

### 4. Get Stripe Configuration

**Endpoint**: `GET /api/stripe-config`

**Description**: Provides Stripe publishable key to the client.

**Response** (Success - 200):
```json
{
  "publishableKey": "pk_test_..."
}
```

**Notes**:
- Publishable key is safe to expose to client
- Used to initialize Stripe.js on the frontend

---

### 5. AI Coin Pricing

**Endpoint**: `POST /api/ai-coin-pricing`

**Description**: Generates dynamic pricing for custom coin amounts using algorithmic pricing (no actual AI - uses smart volume discounts).

**Request Body**:
```json
{
  "coins": 3000
}
```

**Valid Range**: 50 - 50,000 coins

**Response** (Success - 200):
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "coins": 3000,
  "price": 25.99,
  "reasoning": "Volume discount of 18% applied"
}
```

**Response** (Error - 400):
```json
{
  "error": "Invalid coin amount. Must be between 50 and 50,000 coins."
}
```

**Response** (Stripe Error - 200):
```json
{
  "url": null,
  "coins": 3000,
  "price": 25.99,
  "reasoning": "Volume discount of 18% applied",
  "stripeError": "Payment temporarily unavailable, please try again"
}
```

**Pricing Algorithm**:
- Base rate: $1 per 100 coins
- Volume discounts:
  - 500+: 5% off
  - 1000+: 10% off
  - 2500+: 15% off
  - 5000+: 20% off
  - 10000+: 25% off
  - 25000+: 30% off
- Small random variance (±2%) for dynamic feel

**Notes**:
- Creates ephemeral Stripe products and prices
- Returns pricing even if Stripe fails
- Requires `STRIPE_SECRET_KEY` environment variable

---

### 6. Generate Weapon

**Endpoint**: `POST /api/generate-weapon`

**Description**: Procedurally generates a random weapon with stats and rarity.

**Request Body** (Optional):
```json
{
  "preferredType": "weapon"
}
```

**Valid Types**: `weapon`, `ranged`, `ability` (omit for random)

**Response** (Success - 200):
```json
{
  "success": true,
  "weapon": {
    "id": "blazing_sword_abc123",
    "name": "Blazing Sword",
    "icon": "🗡️",
    "type": "weapon",
    "damage": 32,
    "cooldown": 450,
    "energy": 0,
    "desc": "A rare sword infused with blazing power",
    "price": 650,
    "rarity": "rare",
    "special": "Burns enemies on hit"
  }
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to generate weapon"
}
```

**Weapon Properties**:
- **id**: Unique identifier (prefix_base_timestamp)
- **name**: Prefix + Base name (e.g., "Ancient Axe")
- **icon**: Emoji representation
- **type**: `weapon` (melee), `ranged`, or `ability` (magic)
- **damage**: Base damage (varies by weapon type and rarity)
- **cooldown**: Milliseconds between uses
- **energy**: Energy cost (abilities only)
- **desc**: Generated description
- **price**: Cost in coins
- **rarity**: `common`, `uncommon`, `rare`, `epic`, `legendary`
- **special**: Special effect (rare+ weapons only)

**Rarity Distribution**:
- Common: 40% chance, 1.0x damage multiplier
- Uncommon: 30% chance, 1.2x damage multiplier
- Rare: 18% chance, 1.5x damage multiplier
- Epic: 9% chance, 1.8x damage multiplier
- Legendary: 3% chance, 2.2x damage multiplier

**Notes**:
- Fully procedural (no AI API calls)
- Deterministic ranges ensure balance
- Rare+ weapons get special effects

---

## Error Handling

All endpoints follow these conventions:

### Success Responses
- HTTP 200 with JSON payload
- Always includes relevant data

### Error Responses
- HTTP 400: Bad request (invalid input)
- HTTP 405: Method not allowed
- HTTP 500: Server error

### CORS
All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## Environment Variables

Required environment variables for API endpoints:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...           # Stripe secret key (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...      # Stripe publishable key (test mode)

# Optional
ANTHROPIC_API_KEY=sk-ant-...            # For future AI features (not currently used)
```

**Important**: Never commit real keys to version control. Use `.env` file locally and Vercel environment variables in production.

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding in production:
- Vercel Edge Config for rate limit tracking
- Client-side request throttling
- Server-side IP-based limits

---

## Future Improvements

- [ ] Add authentication (JWT or session-based)
- [ ] Implement actual database (Vercel KV, Planetscale, etc.)
- [ ] Add webhook handling for Stripe payment confirmation
- [ ] Rate limiting per IP/user
- [ ] Request validation with schema library (Zod, Joi)
- [ ] Logging and monitoring (Vercel Analytics, Sentry)
- [ ] API versioning (e.g., `/api/v1/...`)
