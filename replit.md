# Overview

PayFlow is a production-ready Payment Gateway Aggregator and Wallet Management System built with Node.js and TypeScript. The system provides a comprehensive REST API for wallet operations, implements double-entry accounting principles, and supports multiple payment gateways through a pluggable adapter architecture. It features a modern React frontend with shadcn/ui components and includes robust authentication, transaction orchestration, and compliance features.

## Recent Development: Complete B2B Infrastructure Architecture

PayFlow has been comprehensively refactored into a pure B2B infrastructure service with proper partner management, API key authentication, and wallet scoping. This transformation positions PayFlow as enterprise-grade financial infrastructure that powers third-party applications.

### Key Architectural Changes
- **Pure B2B Infrastructure**: Complete separation between admin interface and partner APIs
- **Partner-Scoped Operations**: All wallets and transactions belong to specific partners
- **API Key Authentication**: Secure API key system with permissions and rate limiting
- **Multi-Gateway Strategy**: Partners can use their own Stripe Connect accounts or shared infrastructure
- **Comprehensive Admin Tools**: Complete partner onboarding and API key management

### Integration Features
- **Partner Management**: Full lifecycle from application through approval and monitoring
- **API Key System**: Sandbox/production keys with granular permissions
- **Wallet Scoping**: Partner-owned wallets with external ID mapping
- **Real-time Monitoring**: Complete audit trail and usage analytics
- **Webhook Infrastructure**: Event-driven architecture for real-time updates

### B2B Authentication Model
- **Admin Interface**: Session-based authentication for PayFlow administrators
- **Partner APIs**: API key authentication with Bearer tokens
- **Permission System**: Granular permissions (wallets:read, transactions:write, etc.)
- **Rate Limiting**: Per-partner rate limiting and usage tracking

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with protected routes

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Passport.js with local strategy, OIDC/OAuth2 support planned
- **API Design**: RESTful endpoints with OpenAPI v3 documentation structure

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema changes
- **Accounting Model**: Double-entry ledger system with immutable transaction records
- **Key Tables**: users, wallets, transactions, ledger_entries, gateway_transactions
- **Data Integrity**: Foreign key constraints, enums for status validation, UUID primary keys

## Payment Gateway Integration
- **Architecture**: Pluggable adapter pattern for multiple gateway support
- **Implemented Adapters**: Mock adapter for testing, Stripe adapter for production
- **Gateway Operations**: Payment intents, captures, refunds, payouts, webhook verification
- **Extensibility**: Interface-based design allowing easy addition of new payment providers

## Security and Compliance
- **Authentication**: JWT-based API authentication with session management
- **Authorization**: Role-based access control (RBAC) for admin endpoints
- **Data Security**: Secrets management with environment variables, TLS enforcement
- **PCI Compliance**: Minimized scope by delegating card data storage to payment gateways
- **Webhook Security**: HMAC signature verification for incoming webhook events

## Transaction Processing
- **Ledger System**: Immutable double-entry accounting with audit trails
- **Idempotency**: Built-in support for idempotent operations using unique keys
- **Status Tracking**: Comprehensive transaction status management (pending, completed, failed)
- **Balance Calculation**: Computed from ledger entries rather than mutable balance fields
- **Async Processing**: Message queue integration ready for complex transaction orchestration

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL via Neon serverless platform
- **Session Store**: PostgreSQL-backed session storage with connect-pg-simple

## Payment Gateways
- **Stripe**: Official Stripe SDK for payment processing
- **Mock Gateway**: Internal testing adapter for development

## Authentication Services
- **Planned**: Keycloak for OIDC/OAuth2 identity management
- **Current**: Local authentication with Passport.js

## Frontend Libraries
- **React Ecosystem**: React 18 with TypeScript, Vite build system
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with PostCSS processing
- **State Management**: TanStack Query for API state, React Hook Form for forms
- **Validation**: Zod for runtime type validation and schema definitions

## Development Tools
- **Build System**: Vite for frontend, esbuild for backend bundling
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and formatting tools
- **Database Tools**: Drizzle Kit for schema management and migrations