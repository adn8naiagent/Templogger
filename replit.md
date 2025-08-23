# Overview

This is a fullstack web application foundation built with React and Express.js, designed for subscription-based applications. The project uses a monorepo structure with TypeScript throughout, featuring a modern UI built with shadcn/ui components and Tailwind CSS. The backend implements a RESTful API with PostgreSQL database integration via Drizzle ORM, and includes Stripe payment processing for subscription management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in strict mode
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with structured error handling
- **Development**: Hot reload enabled with tsx for server-side TypeScript execution
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development

## Database Schema
- **Users Table**: Core user data with Stripe integration fields (customer ID, subscription ID)
- **Subscriptions Table**: Subscription management with tier, status, and billing period tracking
- **Migration System**: Drizzle Kit for schema versioning and database migrations
- **Connection**: Neon Database serverless PostgreSQL adapter

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **User Management**: User creation and retrieval with username/email uniqueness constraints
- **Subscription Tiers**: Free, Pro, and Enterprise tier definitions with feature flags

## Payment Processing
- **Provider**: Stripe integration for subscription billing
- **Client Integration**: Stripe.js for secure payment form handling
- **Server Integration**: Stripe SDK for subscription management and webhook processing
- **Subscription Flow**: Checkout session creation, webhook handling, and subscription status tracking

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Payment Processing
- **Stripe**: Complete payment processing platform
  - Server-side: Subscription management, customer creation, webhook handling
  - Client-side: Secure payment forms and checkout flows

## UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with customizable design tokens

## Development Tools
- **TypeScript**: Strict type checking across frontend and backend
- **ESLint**: Code linting with React, TypeScript, and Node.js rules
- **Jest**: Testing framework for unit and integration tests
- **Vite**: Fast build tool with hot module replacement

## Deployment & Infrastructure
- **Replit**: Development environment with integrated hosting
- **Railway**: Production deployment platform (configured for Cloud Run compatibility)
- **Environment Management**: Structured environment variable handling for development and production