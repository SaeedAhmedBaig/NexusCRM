# Deploy NexusCRM — Vercel + Render

## Architecture

| Service | Platform | Directory |
|---------|----------|-----------|
| Frontend (Next.js) | **Vercel** | `frontend/` |
| Backend (NestJS API) | **Render** | `backend/` |
| Database | **MongoDB Atlas** | (existing URI) |
| Email | **Brevo** | API key in Render env |

---

## 1. Push to GitHub

Repository: **NexusCRM**

```bash
git init
git add .
git commit -m "Initial production-ready NexusCRM release"
gh repo create NexusCRM --public --source=. --remote=origin --push
```

---

## 2. Deploy backend (Render)

1. Go to [render.com](https://render.com) → **New** → **Blueprint** (or Web Service).
2. Connect GitHub repo **NexusCRM**.
3. Use `render.yaml` at repo root, or manually:
   - **Root directory:** `backend`
   - **Build:** `npm install`
   - **Start:** `npm run start:prod`
4. Set environment variables in Render dashboard:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://.../nexuscrm?...` |
| `JWT_SECRET` | (long random string) |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `APP_DOMAIN` | `your-app.vercel.app` |
| `BREVO_API_KEY` | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | verified sender |
| `BREVO_SENDER_NAME` | `NexusCRM` |
| `SUPERADMIN_EMAIL` | `admin@yourdomain.com` |
| `SUPERADMIN_PASSWORD` | strong password |
| `SUPERADMIN_TENANT_SUBDOMAIN` | `system` |

5. Note your Render URL, e.g. `https://nexuscrm-api.onrender.com`.

---

## 3. Deploy frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import **NexusCRM**.
2. **Root Directory:** `frontend`
3. Framework: Next.js (auto-detected)
4. Environment variables:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_DOMAIN` | `your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://nexuscrm-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `https://nexuscrm-api.onrender.com` |

5. Deploy. Vercel runs `npm run build` automatically.

---

## 4. After first deploy

1. Update Render `FRONTEND_URL` and `CORS_ORIGIN` to your final Vercel URL.
2. Redeploy backend if needed.
3. Test: signup → OTP email → verify → login.
4. Superadmin: `https://your-app.vercel.app/superadmin`

---

## Local production build (verify before deploy)

```powershell
cd frontend
npm run build

cd ../backend
npm install
npm run start:prod
```

---

## Security notes

- **Never commit** `backend/.env` or `frontend/.env.local` (in `.gitignore`).
- Set all secrets only in Vercel / Render dashboards.
- Change default superadmin password before going live.
