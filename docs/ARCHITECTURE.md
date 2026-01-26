# ShatterRealms Architecture

This document describes the technical architecture, design decisions, and system components of ShatterRealms.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Deployment Architecture](#deployment-architecture)
6. [Key Design Decisions](#key-design-decisions)
7. [Performance Considerations](#performance-considerations)
8. [Security Model](#security-model)

---

## System Overview

ShatterRealms is a browser-based 3D dungeon crawler built with a serverless architecture. The game supports both singleplayer wave-based combat and real-time multiplayer PvP.

**Technology Stack**:
- **Frontend**: Vanilla JavaScript + Three.js (WebGL)
- **Multiplayer**: PartyKit (WebSocket server on Cloudflare)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Payments**: Stripe Checkout
- **Deployment**: Vercel (frontend + API) + PartyKit (multiplayer)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                   public/index.html                   │ │
│  │  ┌──────────────────────────────────────────────┐    │ │
│  │  │      Three.js 3D Rendering Engine            │    │ │
│  │  │  - Scene management                          │    │ │
│  │  │  - Player controls                           │    │ │
│  │  │  - Enemy AI                                  │    │ │
│  │  │  - Combat system                             │    │ │
│  │  │  - UI/HUD                                    │    │ │
│  │  └──────────────────────────────────────────────┘    │ │
│  │                                                       │ │
│  │  ┌──────────────────────────────────────────────┐    │ │
│  │  │      PartySocket Client                      │    │ │
│  │  │  - WebSocket connection                      │    │ │
│  │  │  - Position sync                             │    │ │
│  │  │  - Combat events                             │    │ │
│  │  └──────────────────────────────────────────────┘    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │                          │
           │ HTTPS                    │ WebSocket (wss://)
           ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────┐
│   Vercel Functions   │    │   PartyKit Server        │
│   (api/*)            │    │   (party/game.ts)        │
│                      │    │                          │
│  - save.js           │    │  - Player sync           │
│  - stripe-config.js  │    │  - Combat validation     │
│  - create-checkout   │    │  - Match management      │
│  - ai-coin-pricing   │    │  - Kill tracking         │
│  - generate-weapon   │    │                          │
│                      │    │  Hosted on Cloudflare    │
│  Hosted on Vercel    │    │  Workers                 │
└──────────────────────┘    └──────────────────────────┘
           │
           │ API calls
           ▼
┌──────────────────────┐
│   External Services  │
│                      │
│  - Stripe API        │
│    (Payments)        │
│                      │
└──────────────────────┘
```

---

## Component Details

### Frontend (public/index.html + public/styles.css)

**Responsibilities**:
- 3D rendering with Three.js
- Game loop (60 FPS target using requestAnimationFrame)
- Player input handling (keyboard, mouse, touch)
- Enemy AI and spawning
- Local game state management
- UI rendering (menus, HUD, shop)
- Cookie-based persistence (device ID, settings)

**Key Modules** (currently in single file, planned for modularization):
- **Game Loop**: Main update/render cycle
- **Player Controller**: Movement, combat, inventory
- **Enemy System**: Spawning, AI, pathfinding
- **Combat System**: Hit detection, damage calculation
- **UI Manager**: Menus, modals, HUD updates
- **Multiplayer Client**: WebSocket communication
- **Weapon System**: Inventory, attacks, cooldowns

**Graphics**:
- **Renderer**: WebGL via Three.js
- **Post-Processing**: Bloom, FXAA anti-aliasing, color correction, vignette
- **Lighting**: Ambient + directional + point lights for realism
- **Shadows**: Real-time shadow mapping
- **Particles**: Custom particle system for effects

### Backend - Vercel Serverless Functions (api/)

**save.js**:
- Handles GET/POST for player data
- Currently in-memory (ephemeral)
- Future: integrate with Vercel KV or Planetscale

**stripe-config.js**:
- Returns Stripe publishable key to client
- Simple GET endpoint
- No sensitive data exposure

**create-checkout-session.js**:
- Creates Stripe Checkout session for predefined packages
- Handles 4 fixed coin packages
- Redirects user to Stripe payment page

**ai-coin-pricing.js**:
- Dynamic pricing for custom coin amounts
- Algorithmic volume discounts (not AI-based)
- Creates ephemeral Stripe products/prices
- Graceful degradation if Stripe fails

**generate-weapon.js**:
- Procedural weapon generation
- Weighted rarity system
- Random stats within balanced ranges
- Special effects for rare+ weapons

**CORS Helper (api/_lib/cors.js)**:
- Shared CORS configuration
- Reduces code duplication across endpoints

### Multiplayer Server (party/game.ts)

**Technology**: PartyKit (Cloudflare Durable Objects + WebSockets)

**Responsibilities**:
- WebSocket connection management
- Player position synchronization (30 FPS)
- Server-authoritative combat validation
- Match timer (5 minutes)
- Kill/death tracking
- Respawn logic (5-second delay)
- Player list management

**Message Types**:
- `join`: Player enters match
- `leave`: Player exits
- `move`: Position update (30 Hz)
- `attack`: Attack attempt
- `hit`: Damage dealt (server validates)
- `death`: Player eliminated
- `respawn`: Player returns to game

**State Management**:
- Persistent per-room state using Durable Objects
- Stores player positions, health, kills, deaths
- Auto-cleanup on disconnect

---

## Data Flow

### Singleplayer Mode

```
User Action → Client Updates → Render Frame
     ↓
   Combat Occurs → Earn Coins → Save to Cloud (api/save)
     ↓
   Visit Shop → Request Weapon (api/generate-weapon)
     ↓
   Purchase → Update Inventory → Save to Cloud
```

**Save Persistence**:
1. Client stores data in localStorage (immediate)
2. Client stores deviceId in cookies (persistent across sessions)
3. Client syncs to cloud via api/save (when coins change)
4. On load: fetch from cloud, merge with local, cookies provide device ID

### Multiplayer Mode

```
User Joins Match → WebSocket Connect (PartyKit)
     ↓
   Position Updates (Client → Server → All Clients, 30 Hz)
     ↓
   Player Attacks → Client sends 'attack' → Server validates
     ↓
   Server Calculates Hit → Broadcasts 'hit' → Clients Update
     ↓
   Player Dies → Server sends 'death' → 5s Delay → 'respawn'
     ↓
   Match Ends (5 min) → Winner Gets 75 Coins → Save to Cloud
```

**Authority Model**:
- **Client-Authoritative**: Player movement, input
- **Server-Authoritative**: Combat, kills, deaths, match state
- This prevents cheating while maintaining responsive controls

### Payment Flow

```
User Clicks Buy → Client calls api/create-checkout-session
     ↓
   Server Creates Stripe Session → Returns Checkout URL
     ↓
   Client Redirects to Stripe → User Completes Payment
     ↓
   Stripe Redirects Back → URL Params: ?success=true&coins=1200
     ↓
   Client Detects Success → Adds Coins → Saves to Cloud
```

**Note**: Currently no webhook validation. Production should add Stripe webhooks to verify payment before granting coins.

---

## Deployment Architecture

### Vercel Deployment

**What's Deployed**:
- Static assets (public/index.html, public/styles.css, images)
- Serverless functions (api/*.js)

**Build Configuration** (vercel.json):
- Redirects for backwards compatibility
- Environment variables for Stripe keys
- Serverless function regions

**Environment Variables** (set in Vercel dashboard):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Deploy Command**:
```bash
vercel            # Deploy to preview
vercel --prod     # Deploy to production
```

### PartyKit Deployment

**What's Deployed**:
- WebSocket server (party/game.ts)
- Hosted on Cloudflare Workers (edge network)

**Configuration** (partykit.json):
```json
{
  "name": "shatterrealms-multiplayer",
  "main": "party/game.ts"
}
```

**Deploy Command**:
```bash
npm run party:deploy
```

**Post-Deployment**:
- Update `PARTYKIT_HOST` in public/index.html with deployed URL
- Format: `your-project.username.partykit.dev`

### CDN Resources

External dependencies loaded from CDN:
- Three.js (r128): `cdnjs.cloudflare.com`
- PartySocket client: `unpkg.com`
- Three.js addons (EffectComposer, passes, shaders)

**Benefits**:
- Browser caching across sites
- Reduced bundle size
- Faster initial load

---

## Key Design Decisions

### Why Serverless?

**Pros**:
- Zero server management
- Auto-scaling to demand
- Pay only for usage
- Global edge network (low latency)

**Cons**:
- Cold starts (mitigated by Vercel Edge Functions)
- Stateless (must use external storage for persistence)

**Decision**: Serverless fits perfectly for a game with bursty traffic and low backend complexity.

### Why PartyKit for Multiplayer?

**Alternatives Considered**:
- Socket.io + Node.js server (requires server management)
- Firebase Realtime Database (less control, higher latency)
- WebRTC (complex, requires signaling server anyway)

**Why PartyKit**:
- Built on Cloudflare Durable Objects (globally distributed)
- Simple WebSocket API
- Automatic room management
- Low latency (edge network)
- Easy deployment

### Why Three.js Instead of a Game Engine?

**Alternatives**: Unity WebGL, Babylon.js, PlayCanvas

**Why Three.js**:
- Lightweight (~600KB compressed)
- Full control over rendering
- Excellent documentation
- Large community
- No build step required (can use via CDN)

**Trade-off**: More manual work for game logic vs. batteries-included engine

### Client-Side vs. Server-Side Game Logic

**Singleplayer**: 100% client-side
- No server roundtrip needed
- Instant response
- Works offline (after initial load)

**Multiplayer**: Hybrid
- Movement: Client-predicted (responsive)
- Combat: Server-validated (prevents cheating)
- State: Server-authoritative (single source of truth)

### Cookie + LocalStorage + Cloud Sync

**Why All Three**:
- **Cookies**: Persist device ID across sessions/incognito
- **LocalStorage**: Fast, synchronous access for frequent updates
- **Cloud**: Backup, sync across devices (future)

**Data Priority**:
1. LocalStorage (primary, instant)
2. Cloud API (backup, on load/save)
3. Cookies (device identification)

---

## Performance Considerations

### Frontend Optimization

**Target**: 60 FPS on mid-range hardware

**Techniques**:
- Object pooling for enemies/projectiles (reduce GC)
- Frustum culling (don't render off-screen objects)
- LOD (level of detail) for distant objects (planned)
- Batch rendering (combine meshes where possible)
- Texture atlases (reduce draw calls)
- Post-processing optimizations (conditional based on device)

**Mobile**:
- Reduced particle count
- Lower shadow quality
- Simplified post-processing
- Touch controls with joystick

### Network Optimization

**Multiplayer Bandwidth**:
- Position sync: 30 Hz (not 60)
- Only send changed data
- Use binary protocol (future enhancement)

**Current**: ~2-5 KB/s per player (very efficient)

### API Optimization

**Caching**:
- Stripe config cached client-side (sessionStorage)
- Weapon generation is stateless (no caching needed)

**Cold Starts**:
- Vercel Edge Functions are faster
- Keep functions small and focused

---

## Security Model

### Current State

ShatterRealms currently prioritizes ease of development over security. Suitable for demo/MVP.

**What's Secure**:
- ✅ Environment variables for API keys
- ✅ Stripe test mode only
- ✅ HTTPS for all traffic
- ✅ No SQL (no SQL injection risk)

**What's NOT Secure**:
- ❌ No authentication (anyone can save data)
- ❌ No rate limiting (potential abuse)
- ❌ Client-side coin awards (can be manipulated)
- ❌ No webhook verification for payments
- ❌ CORS allows all origins (`*`)

### Future Security Enhancements

**Authentication**:
- Add JWT or session-based auth
- Require login for cloud saves
- Associate saves with user accounts

**Payment Verification**:
- Implement Stripe webhooks
- Server-side coin granting after payment confirmation
- Prevent client-side manipulation

**Rate Limiting**:
- Limit API calls per IP/user
- Prevent spam and abuse
- Use Vercel Edge Config or Redis

**Input Validation**:
- Validate all user inputs server-side
- Use schema validation (Zod, Joi)
- Sanitize data before storage

**CORS**:
- Restrict to specific domains in production
- Use environment-specific configuration

---

## Future Architectural Improvements

### Database Integration

**Current**: In-memory (ephemeral)
**Future**: Persistent storage

**Options**:
- Vercel KV (Redis, serverless)
- Planetscale (MySQL, serverless)
- Supabase (PostgreSQL + auth + realtime)

**Schema** (Proposed):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE,
  username VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE player_data (
  user_id UUID REFERENCES users(id),
  coins INT DEFAULT 0,
  owned_items JSONB,
  stats JSONB,
  updated_at TIMESTAMP
);
```

### Leaderboards

- Global PvP rankings
- Wave completion records
- Store in database
- Display in-game UI

### Analytics

- Track player engagement (Vercel Analytics)
- Monitor errors (Sentry)
- Performance metrics (Web Vitals)
- Conversion tracking (Stripe)

### Modular Frontend

- Split 4000+ line HTML into separate JS modules
- Use ES6 modules or build tool (Vite, Webpack)
- Improve maintainability and enable collaboration

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Main game server
npm run dev

# Terminal 2: Multiplayer server
npm run party:dev

# Test at http://localhost:3000
```

### Testing

```bash
# Run unit tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Deployment

```bash
# Deploy main app to Vercel
vercel --prod

# Deploy multiplayer to PartyKit
npm run party:deploy

# Update PARTYKIT_HOST in index.html after deployment
```

---

## Conclusion

ShatterRealms uses a modern serverless architecture that balances simplicity, scalability, and performance. The current implementation is optimized for rapid development and iteration, with clear paths for adding authentication, persistence, and security as the project matures.

**Strengths**:
- Zero infrastructure management
- Global edge distribution (low latency)
- Cost-effective (pay per use)
- Easy to deploy and iterate

**Areas for Growth**:
- Authentication system
- Persistent database
- Payment verification
- Code modularization
- Advanced security features

This architecture provides a solid foundation for both learning and building a production-ready multiplayer game.
