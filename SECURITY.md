# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in ShatterRealms, please help us by reporting it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead:
1. Email the maintainers privately (email TBD - add your contact)
2. Include "SECURITY" in the subject line
3. Provide:
   - Description of the vulnerability
   - Steps to reproduce it
   - Potential impact
   - Any suggested fixes (optional)

We'll respond within 48 hours and work with you to fix the issue.

## Security Best Practices for Contributors

### Never Commit Secrets

- ❌ **NEVER** commit your `.env` file
- ❌ **NEVER** commit API keys, passwords, or tokens
- ❌ **NEVER** commit real Stripe production keys
- ✅ **ALWAYS** use `.env` for secrets (already in `.gitignore`)
- ✅ **ALWAYS** use test mode for Stripe (`sk_test_*` keys)

### Check Before Pushing

Before pushing code, verify:
```bash
git diff
```

Look for:
- API keys (sk_*, pk_*)
- Database URLs
- Password strings
- Personal email addresses

### If You Accidentally Commit a Secret

1. **Immediately revoke/regenerate the key** in the service (Stripe, etc.)
2. Tell a maintainer right away
3. We'll help remove it from git history

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ Yes             |
| older   | ❌ No              |

We only support the latest version on the `main` branch.

## Known Security Considerations

### Current Architecture

ShatterRealms has these intentional design choices:

1. **CORS allows all origins (`*`)**
   - This is acceptable for a game with no sensitive user data
   - All game state is client-side or temporary

2. **No authentication on API endpoints**
   - Currently okay since endpoints only handle game data
   - Future versions may add auth for competitive features

3. **Client-side game logic**
   - Players can modify their own client
   - Server validates critical actions in multiplayer mode
   - This is typical for web games

4. **Stripe test mode**
   - We use test mode keys in development
   - Production deployments should use environment variables for real keys

### Future Improvements

As the project grows, we may add:
- User authentication (for leaderboards, accounts)
- Rate limiting on API endpoints
- Server-side validation for all game actions
- Content Security Policy headers

## Questions?

Not sure if something is a security issue? When in doubt, report it privately. We'd rather hear about something that isn't a vulnerability than miss something important!
