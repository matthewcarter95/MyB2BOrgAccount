# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**e-ADM Online Services** - B2B organization account management system using Auth0 My Organization APIs with a BFF (Backend-for-Frontend) architecture.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Lambda BFF     │────▶│ Auth0 My Org API│
│  (Amplify)      │     │  (Function URL) │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                      │
        │ Poll /auth/status    ├──────────────────┐
        │                      │                  │
        │                      ▼                  ▼
        │              ┌─────────────────┐  ┌─────────────┐
        │              │  DynamoDB       │  │ Auth0 Token │
        │              │  (Sessions)     │  │ Endpoint    │
        │              └─────────────────┘  └─────────────┘
```

**Frontend:** React + Vite + TypeScript, deployed to AWS Amplify
**Backend:** AWS Lambda with Function URLs (BFF pattern)
**Database:** DynamoDB for session storage with TTL
**Auth:** Auth0 with organization support, role-based access, OIDC backchannel logout
**Region:** us-east-1

## Project Structure

```
/
├── frontend/                    # React app (Vite)
│   ├── src/
│   │   ├── components/          # Header, OrgSelector, OrgSettings, etc.
│   │   ├── pages/               # Home, Dashboard, Callback
│   │   ├── hooks/               # useAuth, useSessionStatus
│   │   └── services/            # API client
│   └── package.json
│
├── backend/                     # Lambda BFF
│   ├── src/
│   │   ├── handler.ts           # Main Lambda handler
│   │   ├── auth.ts              # Auth0 token management
│   │   ├── session.ts           # DynamoDB session store
│   │   ├── myorg.ts             # My Organization API client
│   │   └── routes/              # auth.ts, org.ts, commodities.ts
│   └── package.json
│
├── infra/
│   └── template.yaml            # CloudFormation (Lambda + DynamoDB)
│
├── scripts/
│   ├── add-function-url.sh      # Post-deploy Function URL setup
│   └── deploy-backend.sh        # Full backend deployment
│
└── amplify.yml                  # Amplify build configuration
```

## Color Scheme

- **Primary:** #0a1e67 (navy blue)
- **Accent:** #73c54d (green)
- **Background:** #ffffff (white)

## AWS Deployment Constraints

Company SCPs block the CloudFormation hook `AWS::EarlyValidation::PropertyValidation`, preventing Lambda Function URLs when created via CloudFormation.

**Workaround:** Deploy stack without Function URL, then add post-deployment via `scripts/add-function-url.sh`.

## Commands

```bash
# Install dependencies
npm install

# Build frontend
npm run build -w frontend

# Build backend
npm run build -w backend

# Deploy backend (requires AWS credentials)
./scripts/deploy-backend.sh dev

# Add Function URL post-deployment
./scripts/add-function-url.sh dev
```

## Auth0 Configuration

- **Domain:** devlabs.demo-connect.us
- **Client ID:** uNF6pehJEsJh0SbkzIHOt958Dya80jYJ
- **My Org API Audience:** https://violet-hookworm-18506.cic-demo-platform.auth0app.com/my-org/

**Application Type:** Regular Web Application (confidential client for BFF pattern)

**Required Scopes:**
```
openid profile email offline_access
read:my_org:configuration
read:my_org:details
update:my_org:details
read:my_org:identity_providers
create:my_org:identity_providers
update:my_org:identity_providers
delete:my_org:identity_providers
```

**Callback URLs:**
- `https://myaccount.demo-connect.us/callback`

**Logout URLs:**
- `https://myaccount.demo-connect.us`

**Backchannel Logout URL:**
- `{FUNCTION_URL}/auth/backchannel-logout`

## Custom Claims Namespace

Auth0 Action sets custom claims with namespace `https://example.com`:

```typescript
const namespace = 'https://example.com';
const roles = idToken[`${namespace}/roles`] || [];
const subscriptionTier = idToken[`${namespace}/subscription_tier`] || 'basic';
const fgaUserId = idToken[`${namespace}/fga_user_id`];
```

## API Routes

| Method | Path | Auth | Admin | Description |
|--------|------|------|-------|-------------|
| GET | `/commodities` | No | - | Public commodity prices |
| GET | `/auth/login` | No | - | Initiate Auth0 login |
| GET | `/auth/signup` | No | - | Initiate Auth0 signup |
| GET | `/auth/callback` | No | - | Handle Auth0 callback |
| GET/POST | `/auth/logout` | Yes | - | End session |
| GET | `/auth/me` | Yes | - | Get user info |
| GET | `/auth/status` | Yes | - | Check session validity |
| POST | `/auth/backchannel-logout` | No* | - | Auth0 logout token receiver |
| POST | `/org/switch` | Yes | - | Switch active organization |
| GET | `/org/details` | Yes | No | Get org details |
| PATCH | `/org/details` | Yes | Yes | Update org details |
| GET | `/org/config` | Yes | No | Get org config |
| GET | `/org/identity-providers` | Yes | No | List IdPs |
| POST | `/org/identity-providers` | Yes | Yes | Create IdP |
| PATCH | `/org/identity-providers/:id` | Yes | Yes | Update IdP |
| DELETE | `/org/identity-providers/:id` | Yes | Yes | Delete IdP |

## DynamoDB Session Schema

**Table:** `eadm-sessions-{env}`

```typescript
interface Session {
  sessionId: string;      // PK - UUID
  sid: string;            // Auth0 session ID (GSI)
  userId: string;         // Auth0 user ID (GSI)
  orgId: string;          // Current active organization
  orgs: string[];         // All user organizations
  roles: string[];        // User roles
  idToken: string;        // Encrypted
  accessToken: string;    // Encrypted
  refreshToken: string;   // Encrypted
  revokedAt?: number;     // Set on backchannel logout
  expiresAt: number;      // TTL
  createdAt: number;
}
```

## Environment Variables

**Backend (Lambda):**
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE`
- `FRONTEND_URL`
- `SESSIONS_TABLE`
- `SESSION_ENCRYPTION_KEY`

**Frontend (Vite):**
- `VITE_API_URL` - Lambda Function URL
