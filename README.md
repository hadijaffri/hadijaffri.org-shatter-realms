# ShatterRealms

A 3D wave-based dungeon crawler combat game with multiplayer PvP support.

## For New Contributors

Want to help build ShatterRealms? Check out our [Contributing Guide](CONTRIBUTING.md) to get started!

- [How to Set Up](CONTRIBUTING.md#getting-started)
- [How to Contribute](CONTRIBUTING.md#how-to-contribute)
- [Code Style Guidelines](CONTRIBUTING.md#code-style-guidelines)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## Features

- **Singleplayer Mode**: Wave-based PvE combat against monsters and bosses
- **Multiplayer Mode**: Real-time PvP combat with other players
- **Weapon Shop**: Buy new weapons and abilities with earned coins
- **Cloud + Cookie Persistence**: Your progress is saved both to the cloud and locally
- **5-Minute Matches**: Multiplayer matches are timed with the winner receiving 75 coins

## Tech Stack

- **Frontend**: Vanilla JS + Three.js (WebGL 3D)
- **Multiplayer**: PartyKit (Cloudflare-based WebSocket server)
- **Deployment**: Vercel
- **Storage**: Vercel Serverless Functions + Browser Cookies

## Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then add your Stripe test keys:
- Get them from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- Add both `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to `.env`

**Note**: Only use test mode keys (starting with `sk_test_` and `pk_test_`)

### 3. Start Development Servers

**Main game server:**
```bash
npm run dev
```
Then open `http://localhost:3000`

**Multiplayer server (optional):**
```bash
npm run party:dev
```

This starts the PartyKit WebSocket server for multiplayer features.

## Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Deploy PartyKit

```bash
# Deploy PartyKit server
npm run party:deploy
```

### 3. Update PartyKit Host

After deploying PartyKit, update the `PARTYKIT_HOST` variable in `public/index.html` with your PartyKit deployment URL.

### 4. Configure Domain (Optional)

To use a custom domain like `shatter-realms.com`:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed by Vercel

## Project Structure

```
shatterrealms/
├── public/
│   └── index.html              # Main game (Three.js + multiplayer client)
├── api/
│   ├── save.js                 # Cloud save data
│   ├── create-checkout-session.js  # Stripe payment processing
│   ├── stripe-config.js        # Stripe configuration
│   ├── ai-coin-pricing.js      # AI-based dynamic pricing
│   └── generate-weapon.js      # AI weapon generation
├── party/
│   └── game.ts                 # PartyKit multiplayer WebSocket server
├── package.json                # Dependencies and scripts
├── vercel.json                 # Vercel deployment config
├── partykit.json               # PartyKit deployment config
├── .env                        # Environment variables (not in git)
└── .env.example                # Template for environment setup
```

## Architecture Overview

### Frontend (public/index.html)
- **Game Engine**: Three.js for 3D rendering
- **Game Loop**: RequestAnimationFrame-based update loop (60 FPS target)
- **Input Handling**: Keyboard/mouse for desktop, touch joysticks for mobile
- **State Management**: Client-side JavaScript with localStorage + cookie persistence

### Backend Services

**Vercel Serverless Functions** (api/)
- `save.js` - Persist player data to cloud storage
- `create-checkout-session.js` - Initialize Stripe payment flow
- `stripe-config.js` - Provide Stripe publishable key to client
- `ai-coin-pricing.js` - Generate dynamic coin pricing using AI
- `generate-weapon.js` - Create unique weapons using AI

**PartyKit Multiplayer Server** (party/game.ts)
- Real-time WebSocket communication
- Server-authoritative combat (validates hits, kills, damage)
- Player position synchronization (30 FPS)
- Match management (5-minute timer, respawn logic)

### Data Flow

**Singleplayer Mode:**
1. User plays waves → earns coins → saves to cloud via `api/save.js`
2. User visits shop → calls `api/generate-weapon.js` → AI creates weapon
3. Save updated with new inventory

**Multiplayer Mode:**
1. Client connects to PartyKit WebSocket server
2. Position/action updates sent to server
3. Server validates and broadcasts to all clients
4. Match end → winner gets coins → save to cloud

## Game Controls

### Computer
- **WASD**: Move
- **Mouse**: Look around
- **Left Click**: Attack/Use item
- **Space**: Jump
- **Shift**: Sprint
- **1-6**: Select hotbar slot
- **Tab**: View scoreboard (multiplayer)

### Mobile
- **Left Joystick**: Move
- **Drag Screen**: Look around
- **Attack Button**: Attack/Use item
- **Jump Button**: Jump
- **Dash Button**: Dash

## Multiplayer Protocol

The game uses WebSocket for real-time multiplayer communication:
- Position sync at 30fps
- Server-authoritative damage and kill tracking
- 5-minute match timer
- Automatic respawn after 5 seconds

## Common Issues & Troubleshooting

### Game won't start / Black screen
- Check browser console (F12) for errors
- Verify your browser supports WebGL: visit [get.webgl.org](https://get.webgl.org/)
- Try a different browser (Chrome, Firefox recommended)
- Clear cache and reload

### Stripe errors in development
- Make sure you created a `.env` file (copy from `.env.example`)
- Verify you're using **test mode** keys (start with `sk_test_` and `pk_test_`)
- Check that keys are correctly pasted (no extra spaces)

### Multiplayer not connecting
- Ensure `npm run party:dev` is running in a separate terminal
- Check that PARTYKIT_HOST in `public/index.html` matches your PartyKit URL
- For production, make sure you've deployed PartyKit with `npm run party:deploy`

### Save data not persisting
- Cloud saves require the Vercel API to be running
- Local development: Ensure `npm run dev` is active
- Check browser cookies are enabled (used for device ID)

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## Testing

Currently, the project uses manual testing. Before submitting changes:

1. **Singleplayer**: Play a few waves, verify enemies spawn and combat works
2. **Shop**: Open shop, purchase a weapon, check inventory
3. **Multiplayer**: Join a match, verify you can see other players and combat works
4. **Mobile**: Test on a mobile device or use browser dev tools device emulation

Automated testing framework coming soon!

## License

MIT
