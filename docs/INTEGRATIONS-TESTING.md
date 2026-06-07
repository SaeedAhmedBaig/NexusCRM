# NexusCRM — Platform connections for testing

Use this checklist when you return to wire up external services for end-to-end testing.

## Required (app will not run without these)

| Platform | Env variables | Where to get | What it tests |
|----------|---------------|--------------|---------------|
| **MongoDB** | `MONGODB_URI` | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster, or local `mongodb://127.0.0.1:27017/crm_saas` | All CRM data, auth, tenants, tasks |
| **JWT / encryption** | `JWT_SECRET`, optional `ENCRYPTION_KEY` | Generate a long random string | Login sessions, encrypted email passwords |

## Core local dev (no external signup)

| Setting | Env variables | Notes |
|---------|---------------|-------|
| Frontend URL | `NEXT_PUBLIC_APP_URL`, `FRONTEND_URL`, `APP_URL` | Default `http://localhost:3000` |
| API URL | `NEXT_PUBLIC_API_URL` | Default `http://localhost:4000` (proxied via Next at `/api`) |
| WebSocket | `NEXT_PUBLIC_WS_URL` (optional) | Defaults to API URL; powers chat + live notifications |
| Tenant subdomain | `APP_DOMAIN`, `NEXT_PUBLIC_APP_DOMAIN` | Use `localhost` for local multi-tenant paths like `/tenant1/dashboard` |
| CORS | `CORS_ORIGIN` | Must include `http://localhost:3000` |

## Email & messaging

| Platform | Env variables | Where to get | What it tests |
|----------|---------------|--------------|---------------|
| **Brevo** (transactional) | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | [Brevo](https://www.brevo.com/) → SMTP & API | Signup verification, invites, system emails |
| **SMTP / IMAP** (per tenant) | Configured in UI, not env | Gmail app password, Outlook SMTP, or any provider | Deal emails, mass mail send, IMAP sync |
| **Google OAuth / Gmail** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0, Gmail API | Connect Gmail in Settings → Email accounts |

**Google OAuth redirect URI (local):** `http://localhost:4000/auth/google/callback`

## Billing

| Platform | Env variables | Where to get | What it tests |
|----------|---------------|--------------|---------------|
| **Stripe** (test mode) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_ENTERPRISE` | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) | Plan upgrades, billing portal, webhooks |

**Stripe webhook endpoint (local):** use [Stripe CLI](https://stripe.com/docs/stripe-cli) `stripe listen --forward-to localhost:4000/billing/webhook`

## Telephony

| Platform | Env variables | Where to get | What it tests |
|----------|---------------|--------------|---------------|
| **Zadarma VoIP** | `ZADARMA_KEY`, `ZADARMA_SECRET`, `ZADARMA_FROM_NUMBER` | [Zadarma](https://zadarma.com/) API keys | Click-to-call from CRM (falls back to `tel:` links if unset) |

## Security & public forms

| Platform | Env variables | Where to get | What it tests |
|----------|---------------|--------------|---------------|
| **Google reCAPTCHA v3** | `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) | Public signup and lead capture forms |

## Real-time

| Platform | Env variables | Notes |
|----------|---------------|-------|
| **Socket.IO** (built-in) | Backend on port 4000 | Chat on deals/tasks, notification bell; client uses JWT in `auth.token` |

## Optional / future

| Platform | Status in codebase | Notes |
|----------|-------------------|-------|
| **Redis / BullMQ** | `REDIS_URL` in `.env.example` | Reserved for background jobs; not required for Phase 1 |
| **Zapier** | Marketing copy only | Not implemented |
| **Slack** | Marketing copy only | Not implemented |
| **Microsoft Outlook OAuth** | Not implemented | Use SMTP/IMAP account instead |
| **Google Calendar** | Marketing copy only | Not implemented |

## Demo data seed

| Setting | Value | Effect |
|---------|-------|--------|
| `SEED_DEMO_DATA` | `true` | Seeds sample companies, contacts, leads, deals on first deals list load (once per tenant) |

## Suggested test order

1. MongoDB + JWT → signup, login, tenant workspace
2. `SEED_DEMO_DATA=true` → CRM lists, deal pipeline Kanban, deal detail
3. Brevo → verification / invite emails
4. SMTP or Google OAuth → send email from deal, IMAP sync
5. Stripe test keys → billing settings, plan change
6. reCAPTCHA → public signup hardening
7. Zadarma → click-to-call (optional)
8. Socket.IO → open deal chat in two browsers

## Quick copy: minimum `.env` for full feature smoke test

**`backend/.env`**

```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/crm_saas
JWT_SECRET=your-dev-secret
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
SEED_DEMO_DATA=true
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
RECAPTCHA_SECRET_KEY=
ZADARMA_KEY=
ZADARMA_SECRET=
```

**`frontend/.env.local`**

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_DOMAIN=localhost
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```
