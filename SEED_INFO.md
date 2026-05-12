# Database Seed Information

## Admin Login Credentials
```
Email: admin@tradespot.app
Password: admin123
Role: superadmin
```

## Test DApp User
```
Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Role: user
Balance: $100
```

## Sample Wallets Created
- **Bitcoin (BTC)**: 0.5 BTC (~$25,000)
- **Ethereum (ETH)**: 2.0 ETH (~$5,000)

## Running the Seed Script Again
```bash
cd backend
node seed.js
```

**Note**: The seed script is safe to run multiple times. To clear existing data before seeding, uncomment the delete lines in `seed.js`.

## Testing the Setup
1. Login via frontend with admin credentials
2. Check settings page
3. View test user's wallet balances
4. Test deposit/withdrawal flows
