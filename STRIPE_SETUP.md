# Stripe Setup Instructions for Vercel

## Environment Variables Required

To enable coin purchases, you need to add these environment variables to your Vercel project:

### 1. Go to your Vercel dashboard
- Visit https://vercel.com/dashboard
- Select your project (i-like-mangos)
- Go to Settings → Environment Variables

### 2. Add these variables:

**STRIPE_SECRET_KEY**
```
Get this from your local .env file or Stripe dashboard (starts with sk_test_)
```

**STRIPE_PUBLISHABLE_KEY**
```
Get this from your Stripe dashboard (starts with pk_test_)
```

**Note**: Your actual keys are stored in your local `.env` file which is not committed to Git for security reasons.

### 3. Select environments
- Check: Production
- Check: Preview
- Check: Development

### 4. Save and redeploy
After adding the variables, trigger a new deployment or wait for the next push to deploy.

## Coin Packages Available

- **Small Pack**: 500 coins for $4.99
- **Medium Pack**: 1,200 coins for $9.99
- **Large Pack**: 2,500 coins for $19.99
- **Mega Pack**: 6,000 coins for $49.99

## Testing

These are TEST mode keys, so no real charges will be made. Use Stripe test card:
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Production Setup

When ready for production:
1. Get your live keys from Stripe dashboard
2. Replace the test keys with live keys in Vercel
3. Update success/cancel URLs if needed
