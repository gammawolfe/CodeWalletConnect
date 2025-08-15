# PayFlow Integration Environment Setup

## Required Environment Variables

Add these environment variables to your RoSaBank project to enable PayFlow integration:

### PayFlow Service Configuration
```bash
# PayFlow API Configuration
PAYFLOW_BASE_URL=http://localhost:7000  # URL of your PayFlow service
PAYFLOW_API_KEY=your_payflow_api_key_here  # API key for PayFlow service

# PayFlow Feature Flags
ENABLE_REAL_PAYMENTS=false  # Set to true in production for real Stripe payments
DEFAULT_CURRENCY=USD  # Default currency for new wallets

# Stripe Configuration (if using real payments)
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
VITE_STRIPE_PUBLIC_KEY=pk_test_...  # Your Stripe publishable key (for frontend)
```

### Database Configuration (if needed)
```bash
# Database URL (if different from main RoSaBank database)
PAYFLOW_DATABASE_URL=postgresql://...  # Optional: separate database for PayFlow
```

## Setup Instructions

### 1. PayFlow Service Setup

First, ensure your PayFlow service is running and accessible:

1. **Start PayFlow Service:**
   ```bash
   cd /path/to/payflow
   npm run dev
   ```

2. **Verify PayFlow is running:**
   ```bash
   curl http://localhost:7000/api/health
   ```

3. **Create API Key for RoSaBank:**
   ```bash
   # In PayFlow, create an API key for RoSaBank integration
   curl -X POST http://localhost:7000/api/auth/api-keys \
     -H "Content-Type: application/json" \
     -d '{"name": "RoSaBank Integration", "permissions": ["wallet:read", "wallet:write", "transaction:read", "transaction:write"]}'
   ```

### 2. RoSaBank Configuration

1. **Update Environment Variables:**
   Add the environment variables above to your `.env` file or Replit secrets.

2. **Install Integration Dependencies:**
   ```bash
   # If any additional dependencies are needed
   npm install
   ```

3. **Update RoSaBank Routes:**
   Replace the existing wallet service routes with the new PayFlow integration routes.

### 3. Development vs Production

#### Development Setup
- Set `ENABLE_REAL_PAYMENTS=false`
- Use PayFlow's test/mock adapters
- Can use localhost URLs for PayFlow service

#### Production Setup
- Set `ENABLE_REAL_PAYMENTS=true`
- Configure real Stripe API keys
- Use production PayFlow service URL
- Ensure proper SSL/TLS configuration

## Testing the Integration

### 1. Health Check
```bash
curl http://localhost:3000/api/payflow/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "payflow",
  "timestamp": "2025-01-11T10:00:00.000Z"
}
```

### 2. Create Test Wallet
```bash
curl -X POST http://localhost:3000/api/wallets/groups \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "test-group-1",
    "groupName": "Test ROSCA Group",
    "currency": "USD",
    "creatorUserId": "test-user-1"
  }'
```

### 3. Check Wallet Balance
```bash
curl "http://localhost:3000/api/wallets/groups/test-group-1/balance?walletId=wallet-id-from-creation"
```

## Migration from Existing System

If you have existing groups with the old wallet system:

### 1. Data Migration Script
Create a migration script to:
- Create PayFlow wallets for existing groups
- Update group records with new wallet IDs
- Migrate transaction history if needed

### 2. Gradual Migration
- Run both systems in parallel initially
- Migrate groups one by one
- Verify data integrity after migration

### 3. Rollback Plan
- Keep backup of original wallet data
- Ability to revert to old system if needed
- Monitor for any integration issues

## Monitoring and Troubleshooting

### Common Issues

1. **PayFlow Service Unavailable**
   - Check if PayFlow service is running
   - Verify network connectivity
   - Check API key validity

2. **Invalid API Key**
   - Verify PAYFLOW_API_KEY is correct
   - Check API key permissions
   - Regenerate key if necessary

3. **Currency Mismatch**
   - Ensure consistent currency usage
   - Check DEFAULT_CURRENCY setting
   - Verify Stripe supports the currency

### Logging

Enable detailed logging for troubleshooting:
```bash
DEBUG=payflow:* npm run dev
```

### Health Monitoring

Set up monitoring for:
- PayFlow service availability
- API response times
- Transaction success rates
- Error rates and types

## Security Considerations

1. **API Key Security:**
   - Store API keys securely
   - Rotate keys regularly
   - Use environment variables, never commit to code

2. **Network Security:**
   - Use HTTPS in production
   - Implement proper firewall rules
   - Consider VPN for service-to-service communication

3. **Data Protection:**
   - Encrypt sensitive data
   - Implement proper access controls
   - Regular security audits

4. **Compliance:**
   - Ensure PCI compliance for payment data
   - Follow data protection regulations
   - Implement proper audit trails