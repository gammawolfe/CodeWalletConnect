# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PayFlow is a B2B financial infrastructure platform that provides wallet management, transaction processing, and payment gateway integration services to partner organizations. The system supports both a web admin interface for PayFlow team management and API endpoints for partner integration.

## Development Commands

### Build and Development
- `npm run dev` - Start backend server in development mode
- `npm run dev:frontend` - Start frontend development server (Vite)
- `npm run dev:full` - Run both backend and frontend concurrently
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start production server

### Testing
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run coverage` - Run tests with coverage report

### Database
- `npm run db:push` - Push schema changes to database using Drizzle
- `npm run check` - Run TypeScript type checking

## Architecture

### Stack
- **Backend**: Express.js with TypeScript (ESM modules)
- **Frontend**: React with Vite, Wouter for routing
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives with custom design system
- **Styling**: TailwindCSS with custom component library
- **Testing**: Vitest with coverage
- **Payment Gateway**: Stripe integration

### Project Structure
```
client/          # React frontend application
server/          # Express.js backend
  adapters/      # Payment gateway adapters (Stripe, Mock)
  auth.ts        # Session-based authentication for admin
  auth-api.ts    # API key authentication for partners
  repositories/  # Data access layer (Drizzle queries)
  services/      # Business logic layer
  routes.ts      # API route definitions
shared/          # Shared types and database schema
integration/     # Partner integration examples and documentation
docs/           # Architecture and integration documentation
```

### Database Design
- **Double-entry ledger system** for transaction integrity
- **Partner-scoped data isolation** - all wallets belong to partners
- **API key authentication** with granular permissions
- **Comprehensive audit trail** for all financial operations

### Authentication Models
1. **Admin Interface**: Session-based auth with CSRF protection for PayFlow team
2. **Partner APIs**: Bearer token authentication using API keys with permission-based access control

## Key Implementation Patterns

### Repository Pattern
Data access is centralized in repository classes under `server/repositories/`. All database operations should go through repositories, never directly in route handlers or services.

### Service Layer
Business logic is implemented in service classes under `server/services/`. Services orchestrate between repositories and handle complex business operations.

### Error Handling
- Use structured error responses with consistent JSON format
- Validate all inputs using Zod schemas from `shared/schema.ts`
- Handle idempotency for financial operations using `idempotencyKey`

### Financial Operations
- All monetary amounts are stored as decimal strings with 2 decimal precision
- Every transaction creates corresponding ledger entries for double-entry bookkeeping
- Balance calculations are derived from ledger entries, not stored balances
- Idempotency keys prevent duplicate transactions

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Required for session encryption
- `NODE_ENV` - Set to 'production' in production

### Optional Variables
- `CORS_ORIGIN` - Allowed origins for CORS (defaults to allow all)
- `PORT` - Server port (defaults to 3000)
- `STRIPE_API_VERSION` - Stripe API version

## Testing Standards

### Test Location
- Tests should be placed in `__tests__` directories within the relevant modules
- Example: `server/repositories/__tests__/users-repository.test.ts`

### Test Configuration
- Vitest is configured to load dotenv automatically
- Test database URL can be set via `DATABASE_URL` environment variable
- Tests run in Node.js environment with globals enabled

### Coverage Requirements
Run `npm run coverage` to ensure adequate test coverage for new code, especially in repositories and services.

## API Integration Patterns

### Partner API Authentication
```typescript
// All partner API calls require Bearer token authentication
headers: {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
}
```

### Data Scoping
- All partner data is automatically scoped by partner ID from the authenticated API key
- Wallet ownership validation is enforced through middleware
- External ID mapping allows partners to use their own identifiers

### Webhook Integration
- Stripe webhooks require raw body verification - do not JSON parse before signature verification
- Partner outbound webhooks should be HMAC signed for security

## Development Notes

### Module System
- Project uses ESM modules (`"type": "module"` in package.json)
- Use ES6 import/export syntax throughout
- TypeScript configuration supports path aliases: `@shared`, `@` (client src)

### Session Security
- Session secret is required to start the server
- Cookies use `httpOnly`, `sameSite=lax`, and `secure` in production
- CSRF protection: GET `/api/csrf-token` for token, send `X-CSRF-Token` header on auth POSTs

### Drizzle ORM Usage
- Schema definitions are in `shared/schema.ts`
- Use `drizzle-zod` for automatic validation schemas
- Push schema changes with `npm run db:push`
- All queries should use typed repository methods