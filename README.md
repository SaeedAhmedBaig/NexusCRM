# CRM SaaS Platform

Multi-tenant CRM built with **Next.js** (App Router, Tailwind CSS 4) and **NestJS** (JavaScript), backed by **MongoDB**. Phase 0–3 are implemented: foundation, auth/RBAC, marketing site, and onboarding wizard.

## Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind 4    |
| Backend  | NestJS 11, Passport JWT, Mongoose   |
| Data     | MongoDB (single DB, `tenantId` scope) |
| Cache    | Redis URL reserved for BullMQ later |

## Repository layout

```
crm-saas/
├── frontend/          # Next.js app (subdomain routing, auth UI)
├── backend/           # NestJS API (tenant + auth modules)
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 20+
- MongoDB Atlas URI (or local instance)
- Brevo API key for invitation / verification emails (optional — logs to console if unset)
- Redis / BullMQ not required until later phases

## Quick start

### 1. Environment

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Edit `SUPERADMIN_EMAIL` in `backend/.env` to match the email you will register with for superadmin access.

### 2. Install & run

```bash
# Terminal 1 – API
cd backend
npm install
npm run start:dev

# Terminal 2 – Web
cd frontend
npm install
npm run dev
```

### 3. Try it

| Action | URL |
| ------ | --- |
| Marketing home | http://localhost:3000 |
| Demo tenant (hardcoded) | http://tenant1.localhost:3000 |
| Register workspace | http://localhost:3000/register |
| Superadmin tenant list | http://localhost:3000/admin/tenants |

After registration you are redirected to `https://{subdomain}.localhost:3000/onboarding`.

## Multi-tenancy model

- **Isolation:** Single MongoDB database; every tenant-scoped document will carry `tenantId` (indexed).
- **Routing:** `acme.localhost:3000` → subdomain `acme` via Next.js middleware rewrite to `/acme/*`.
- **API:** NestJS `TenantMiddleware` reads `Host` / `X-Forwarded-Host`, resolves tenant, sets `req.tenantId`.
- **Auth:** Registration creates `Tenant` + `User` + `UserTenant` (role `owner`). Login is scoped to a subdomain.
- **Guard:** Global `TenantGuard` ensures JWT user belongs to the resolved tenant.
- **Superadmin:** User whose email matches `SUPERADMIN_EMAIL` can `GET /tenants`.

## Phase 3 — Auth UI & onboarding

- **`/login`** — react-hook-form, validation, forgot password, sign up link
- **`/signup`** — email, password, company, subdomain, plan picker (Free / Pro trial), optional reCAPTCHA v3
- **`POST /api/auth/signup`** — creates Tenant + User + UserTenant (owner), default Department, Groups, LeadSources
- **`/[tenant]/onboarding`** — 5-step wizard (company, departments, invites, email, theme)
- **`POST /api/tenants/onboarding/complete`** — saves settings, marks `onboardingCompleted=true`
- Skipped steps (email) → complete later at `/[tenant]/settings/email`

## Phase 2 — Marketing site

Public landing at `/` with no auth required:

- **Hero** — headline, CTAs (Start free trial, Contact sales)
- **FeaturesGrid** — 8 feature cards
- **PricingCards** — Free / Pro / Enterprise with monthly/yearly toggle
- **Testimonials** — auto-rotating carousel
- **Footer** — Privacy, Terms, Contact links

| Route | Purpose |
| ----- | ------- |
| `/` | Landing page |
| `/signup?plan=pro` | Signup with plan pre-selected |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/contact` | Contact sales form |

**API:** `GET /api/public/plans` — pricing data (hardcoded, cacheable)

Brand name: **NexusCRM** — indigo design system across marketing + app.

## Phase 1 — Auth & RBAC

- Tenant-aware login (`tenantId` or subdomain) with multi-tenant picker
- Expanded roles: owner, admin, chief, manager, operator, co-worker, accountant, task_operator
- CASL-based permissions per tenant (`CaslAbilityFactory`)
- Invitation flow: `POST /api/tenants/invite` → Brevo email → `/invite/[token]`
- User management: `/[tenant]/settings/users`
- Role management: `/[tenant]/settings/roles`
- Departments with tenant scoping
- Tenant switcher in navbar (multi-tenant users)
- UI permission gating (e.g. co-workers cannot see Analytics tab)

### Key API routes (prefix `/api`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/auth/login` | Login with `{ email, password, tenantId }` |
| POST | `/auth/discover-tenants` | List workspaces for credentials |
| POST | `/auth/switch-tenant` | Switch active tenant JWT |
| GET | `/auth/my-tenants` | List user's tenants |
| POST | `/tenants/invite` | Invite user (owner/admin) |
| GET | `/tenants/users` | List tenant members |
| GET | `/tenants/groups` | Role groups + permissions |
| GET | `/tenants/departments` | Departments |

## Phase 0 acceptance checklist

- [x] `tenant1.localhost:3000` shows tenant-specific demo page
- [x] Register creates tenant + owner user
- [x] Tenant guard blocks cross-tenant access
- [x] Superadmin can list all tenants

## API endpoints (Phase 0)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/auth/register` | Public | Create tenant + owner |
| POST | `/auth/login` | Public | Tenant-scoped login |
| GET | `/auth/me` | JWT + tenant | Current session |
| GET | `/tenants/resolve/:subdomain` | Public | Resolve tenant metadata |
| GET | `/tenants` | Superadmin | List all tenants |
| GET | `/tenant-data/members` | JWT + tenant | Tenant-scoped members |

## Notes

- Docker is intentionally **not** used in this project.
- Custom domains are stored on the `Tenant` model (`customDomain`) and resolved in `TenantService.resolveFromHost`.
- Subdomains must be ≥ 3 characters (`a-z`, `0-9`, `-`).
