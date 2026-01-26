# Contributing to ShatterRealms

Thanks for your interest in contributing to ShatterRealms! This guide will help you get started.

## Prerequisites

Before you begin, make sure you have:
- **Node.js 20 or newer** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **A code editor** - We recommend [VS Code](https://code.visualstudio.com/)
- **A GitHub account** - [Sign up here](https://github.com/join)

## Getting Started

### 1. Fork and Clone

1. Click the "Fork" button at the top right of this repository
2. Clone your fork to your computer:
   ```bash
   git clone https://github.com/YOUR-USERNAME/shatter-realms.git
   cd shatter-realms
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Get your Stripe test keys:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Create a free account if needed
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
   - Paste them into your `.env` file

**IMPORTANT**: Never commit your `.env` file! It's already in `.gitignore`.

### 4. Run the Game Locally

Start the main game server:
```bash
npm run dev
```

Open your browser to `http://localhost:3000` to play!

For multiplayer features, start the PartyKit server in a separate terminal:
```bash
npm run party:dev
```

## How to Contribute

### Reporting Bugs

Found a bug? Please create an issue using the bug report template:
1. Go to the [Issues tab](../../issues)
2. Click "New Issue"
3. Select "Bug Report"
4. Fill out the template with as much detail as possible

### Suggesting Features

Have an idea for a new feature? We'd love to hear it!
1. Go to the [Issues tab](../../issues)
2. Click "New Issue"
3. Select "Feature Request"
4. Describe your idea clearly

### Making Code Changes

1. **Create a new branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** - Edit the code, test thoroughly

3. **Test everything**:
   - Run the game in singleplayer mode
   - Test the weapon shop
   - If you changed multiplayer code, test with `npm run party:dev`
   - Make sure there are no console errors

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Brief description of what you changed"
   ```

   Good commit messages:
   - ✅ "Fix enemy spawn rate in wave 10"
   - ✅ "Add new sword weapon type"
   - ❌ "Fixed stuff"
   - ❌ "Changes"

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the original ShatterRealms repository
   - Click "Pull Requests" → "New Pull Request"
   - Click "compare across forks"
   - Select your fork and branch
   - Fill out the PR template
   - Submit!

## Code Style Guidelines

- **Indentation**: Use 2 spaces (not tabs)
- **Naming**: Use camelCase for variables and functions
  ```javascript
  // Good
  let playerHealth = 100;
  function spawnEnemy() { }

  // Bad
  let player_health = 100;
  function SpawnEnemy() { }
  ```
- **Comments**: Add comments to explain complex logic
- **No console.log**: Remove debug logs before submitting (unless needed for error handling)
- **Keep it simple**: Don't over-engineer - simple code is better than clever code

## What to Work On

Not sure where to start? Check out:
- Issues labeled [`good first issue`](../../labels/good%20first%20issue) - Perfect for beginners
- Issues labeled [`help wanted`](../../labels/help%20wanted) - We need help with these!
- The [Project Roadmap](../../projects) - See what features are planned

## Areas of the Codebase

- `public/index.html` - Main game code (Three.js, game loop, UI)
- `api/` - Server-side functions (saving data, Stripe payments, AI features)
- `party/game.ts` - Multiplayer server code (PartyKit WebSocket server)
- `vercel.json` - Deployment configuration
- `partykit.json` - Multiplayer server configuration

## Testing Your Changes

Before submitting a PR, verify:
- [ ] Game loads without errors
- [ ] Singleplayer mode works (enemies spawn, combat works, waves progress)
- [ ] Weapon shop opens and items can be purchased
- [ ] Inventory shows correctly
- [ ] No new console errors or warnings
- [ ] If you changed multiplayer code: Can join matches, see other players, combat works
- [ ] Your code doesn't expose any API keys or secrets

## Getting Help

Stuck? Need help? Here's how to get support:
- **Questions about the code**: Open a [Discussion](../../discussions)
- **Found a bug**: Create an [Issue](../../issues)
- **Want to chat**: Join our community (link TBD)

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We want ShatterRealms to be a welcoming place for everyone!

## License

By contributing to ShatterRealms, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ShatterRealms!** Every contribution, no matter how small, helps make the game better for everyone.
