# Zamindar Plus Project Handoff

Last updated: 14 June 2026

This document is for moving the project to another Codex profile or developer. It explains what Zamindar Plus is, how it is built, what is currently implemented, how to run it locally, what was intentionally removed, and what still needs attention.

Important security note: this handoff intentionally does not include real SMTP passwords, Google client secrets, Gemini keys, JWT secrets, database passwords beyond the local Docker defaults, or any other private secret. Real secrets are stored only in ignored local `.env` files or should be provided separately by the owner.

## 1. Project Summary

Zamindar Plus is a farm ledger platform for managing:

- User accounts and authentication.
- Farm profiles.
- Zameen records.
- Crop cycles.
- Expenses.
- Income.
- Profit/loss reporting.
- Admin user management.
- Settings and account preferences.
- A project-scoped AI assistant called Zamindar AI.

The project was originally AI-generated and then rebuilt step by step so the owner could understand it from scratch. The current repository is a private GitHub monorepo.

Repository:

- GitHub: `talha-ghaffar-ch/zamindar-plus`
- Branch: `main`
- Repo style: one private monorepo.

## 2. Current Tech Stack

Website:

- React
- Vite
- TypeScript
- React Compiler variant from Vite setup

Backend:

- NestJS
- TypeScript
- JWT authentication
- Prisma ORM

Database:

- PostgreSQL
- Local runtime through Docker Compose

AI:

- Backend-proxied Gemini call
- Frontend never receives the Gemini API key
- Fallback local response exists if Gemini/key/network fails

Repository structure:

```text
zamindar-plus/
  apps/
    web/        React + Vite website
    api/        NestJS backend
  packages/
    shared/     shared utilities such as area conversion
  .github/
    workflows/  CI checks only, no deployment
  docker-compose.yml
  PROJECT_HANDOFF.md
```

Mobile app:

- Planned later.
- Intended stack: React Native CLI + TypeScript.
- Not implemented yet.

## 3. Important Project Direction

The owner decided to pause deployment and keep the project local for now. AWS, Amplify, EC2, RDS, Elastic IP, deployment keys, GitHub deployment secrets, deployment workflows, and deployment scripts were removed/reset earlier.

Current deployment status:

- No active deployment configuration should be considered current.
- No production Docker setup exists yet.
- No production database is configured in this repo.
- `.github/workflows/ci.yml` is CI only.
- `docker-compose.yml` is local PostgreSQL only.

Do not reintroduce deployment unless the owner explicitly asks for it.

## 4. Local Development Setup

Recommended commands from repo root `E:\zamindar-plus`:

```powershell
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
```

Run backend:

```powershell
npm run dev:api
```

Run frontend in another terminal:

```powershell
npm run dev:web
```

Default local URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Useful checks:

```powershell
npm run build:web
npm run lint:web
npm run build:api
npm run lint:api
npm run test:api
```

Full local check:

```powershell
npm run check
```

## 5. Environment Variables

Examples exist in:

- `.env.example`
- `apps/api/.env.example`
- `apps/web/.env.example`

Actual local env files are ignored and must not be committed.

Backend env variables:

```text
DATABASE_URL
APP_URL
CORS_ORIGIN
JWT_SECRET
GOOGLE_CLIENT_ID
GEMINI_API_KEY
GEMINI_MODEL
EMAIL_DELIVERY_ENABLED
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_TEST_EMAIL
SEED_TEST_PASSWORD
```

Frontend env variables:

```text
VITE_API_URL
VITE_GOOGLE_CLIENT_ID
```

Notes:

- `GOOGLE_CLIENT_ID` is used by the API to verify Google ID tokens.
- `VITE_GOOGLE_CLIENT_ID` is used by the browser to render the Google button.
- `GEMINI_API_KEY` must be backend-only.
- `SMTP_PASSWORD` must never be committed.
- `JWT_SECRET` must be strong in real deployment.

## 6. Database Design

Main Prisma models:

- `User`
- `Profile`
- `Zameen`
- `Crop`
- `Expense`
- `Income`

Relationship flow:

```text
User
  -> Profile
      -> Zameen
          -> Crop
              -> Expense
              -> Income
```

User-scoping:

- Profiles belong to the current user.
- Zameen belongs through profile ownership.
- Crops belong through zameen/profile ownership.
- Expenses and income belong through crop/zameen/profile ownership.
- Reports are scoped to the current authenticated user.
- Admin user management is role-gated.

Current migrations are in `apps/api/prisma/migrations/`.

## 7. Backend Overview

NestJS modules include:

- `auth`
- `users`
- `profiles`
- `zameen`
- `crops`
- `expenses`
- `income`
- `reports`
- `ai`
- `prisma`

Authentication:

- JWT bearer auth.
- `JwtAuthGuard` protects private routes.
- `CurrentUserId` decorator reads `userId` from the token.

Auth routes include:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/google`
- `POST /auth/connect-google`
- `POST /auth/disconnect-google`
- `GET /auth/me`

Google account behavior:

- Google login/signup uses Google Identity Services ID credential.
- API verifies token using `GOOGLE_CLIENT_ID`.
- Existing password accounts can connect Google from Settings.
- Connect requires the Google email to exactly match the logged-in account email.
- If connected, Settings shows disconnect option.
- Disconnect clears `googleId` and changes `authProvider` back to password mode.

Email behavior:

- Signup creates a verification code and sends it by email.
- User must enter the code to verify account.
- Forgot password sends a reset code by email.
- User enters code and new password.
- The old local test-code display was removed from the frontend.
- In non-production API responses, dev tokens may still exist internally for local/debug behavior, but the UI no longer shows them.

AI behavior:

- `POST /ai/chat` is protected by JWT.
- The API calls Gemini using `GEMINI_API_KEY`.
- The frontend sends only the user message and recent in-memory chat history.
- The backend system prompt restricts Zamindar AI to Zamindar Plus and farm ledger topics.
- If Gemini fails, the backend returns a local project-only fallback response instead of throwing a user-facing failure.

## 8. Frontend Overview

Main pages:

- `AuthPage`
- `DashboardPage`
- `ProfilesPage`
- `ZameenPage`
- `CropsPage`
- `ExpensesPage`
- `IncomePage`
- `ReportsPage`
- `SettingsPage`
- `AdminPage`
- `HelpPage`
- `ZamindarAiPage`

App shell:

- Sidebar navigation.
- Collapsible sidebar.
- Toast notifications.
- Auth session restore from local storage.
- Auth-expired event handling.

Auth page:

- Sign in.
- Create account.
- Email verification code screen.
- Forgot password screen.
- Password reset code screen.
- Google sign in/sign up button.
- Forgot password button appears only after invalid login attempt.

Settings page:

- Profile photo picker and small custom image upload.
- Account info.
- Preferences.
- Google account connect/disconnect.
- Notification preferences.
- Password update.
- Delete account.
- Date format selector was removed because the app now standardizes date display as `dd/mm/yyyy`.

Dashboard:

- Profit pulse.
- Summary metrics.
- Quick actions.
- Monthly movement chart.
- Zamindar AI launch card.

Reports:

- Summary KPIs.
- Filters.
- Overview, crop profitability, and monthly movement views.
- CSV export buttons.
- Print button.
- More compact styling was added to reduce scrolling.

Zamindar AI page:

- Modern chat UI.
- Session-only chat history in React state.
- Refresh/close clears the chat.
- No database persistence for chat.

## 9. Date Format Decision

The website should display dates as:

```text
dd/mm/yyyy
```

Shared frontend helper:

- `apps/web/src/lib/recordGrouping.ts`
- `formatDate()` manually formats dates to `dd/mm/yyyy`.

The Settings date-format selector was removed to avoid inconsistent display across pages.

## 10. Admin vs Normal User

Normal user can:

- Sign up and verify email.
- Sign in with password or Google.
- Reset password by email code.
- Manage own account settings.
- Connect/disconnect matching Google account.
- Create/manage own profiles.
- Create/manage own zameen.
- Create/manage own crops.
- Create/manage own expenses and income.
- View own dashboard and reports.
- Use Zamindar AI.

Admin user can additionally:

- Open Admin panel.
- View user list.
- See user counts and verified counts.
- Create users.
- Assign role when creating users.
- Delete other users.

Current Admin panel is a GUI management panel, not a full audit/compliance console.

## 11. Local Docker

`docker-compose.yml` is local-only and starts PostgreSQL:

```text
container: zamindar-plus-postgres
image: postgres:18-alpine
database: zamindar_plus
user: zamindar
password: zamindar_local_password
port: 5432
```

This Docker setup is not production deployment.

## 12. GitHub Actions

`.github/workflows/ci.yml` runs:

- Checkout
- Setup Node 24
- `npm ci`
- Prisma generate
- Prisma migrate
- Web build
- Web lint
- API build
- API lint
- API smoke test

This is CI only. It does not deploy anything.

## 13. Deployment History And Current Policy

Deployment was previously explored with:

- AWS RDS PostgreSQL
- EC2
- Nginx
- PM2
- Certbot
- Elastic IP
- AWS Amplify
- GitHub Actions deployment pipeline

The owner later chose to demolish/reset deployment and remove deployment artifacts from the repo and cloud account.

Current policy:

- Keep the project local until it is truly ready.
- Do not assume AWS deployment is active.
- Do not add deployment configs unless explicitly requested.

## 14. Current Known Gaps / Future Work

Still not complete for real-world production:

- Production deployment is intentionally removed.
- Production Dockerfiles and compose files are not present.
- Production database is not configured.
- Backups/monitoring/logging/SSL/domain are not configured.
- Mobile app is not implemented.
- Notification preferences exist, but SMS/weekly scheduled report delivery is not implemented.
- Email verification and password reset depend on valid SMTP env values.
- Google auth depends on correct OAuth origins/client ID env values.
- Zamindar AI depends on valid Gemini key and internet access. It has a fallback response if Gemini fails.
- No advanced audit log for admin actions.
- No file storage service for large profile images; custom image upload is small local data URL only.
- No formal end-to-end browser test suite.

## 15. User Preferences For Future Codex Work

The owner prefers:

- Minimize token/credit usage.
- Do not do broad rescans unless necessary.
- Work only on files directly related to the task.
- Avoid unnecessary refactors.
- Avoid lengthy reports unless explicitly asked.
- Do not push to GitHub unless explicitly asked.
- Keep implementation quality high despite minimizing work.
- Explain when broader testing or analysis is actually needed.

When making changes:

- Use `apply_patch` for code/file edits.
- Do not commit secrets.
- Prefer focused build/lint checks.
- Keep frontend visually polished and modern.
- Keep UI responsive.
- Keep dates in `dd/mm/yyyy`.
- Keep user-facing text professional, not over-capitalized.

## 16. Recent Work In This Handoff Batch

Recent unpushed changes before this document included:

- Google account connect/disconnect from Settings.
- `googleConnected` status returned from API.
- Hidden local test verification/reset codes from frontend.
- Zamindar AI backend module and frontend chat page.
- Dashboard AI card.
- Compact dashboard/report styling.
- Admin panel warning cleanup.
- Fixed strict `dd/mm/yyyy` date display.
- Removed Settings date format selector.
- AI fallback response if Gemini fails.

Verification performed before this handoff:

```powershell
npm run build:web
npm run build:api
npm run lint:web
npm run lint:api
```

All passed.

## 17. How To Continue From Here

Recommended next steps for another Codex:

1. Pull latest `main`.
2. Ensure local `.env` files are present and valid.
3. Run Docker PostgreSQL.
4. Run migrations and Prisma generate.
5. Start API and web locally.
6. Test auth flows:
   - Signup email code.
   - Login.
   - Forgot password code.
   - Google sign in/sign up.
   - Connect/disconnect Google in Settings.
7. Test farm records:
   - Create profile.
   - Create zameen.
   - Create crop.
   - Add expense.
   - Add income.
   - Check dashboard/reports.
8. Test Zamindar AI with both project and non-project prompts.
9. Only then decide on production deployment architecture.

## 18. Important Files

Backend:

- `apps/api/src/app.module.ts`
- `apps/api/src/app.setup.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/email.service.ts`
- `apps/api/src/ai/ai.service.ts`
- `apps/api/src/ai/ai.controller.ts`
- `apps/api/prisma/schema.prisma`

Frontend:

- `apps/web/src/App.tsx`
- `apps/web/src/App.css`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/recordGrouping.ts`
- `apps/web/src/pages/AuthPage.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/pages/SettingsPage.tsx`
- `apps/web/src/pages/AdminPage.tsx`
- `apps/web/src/pages/ZamindarAiPage.tsx`
- `apps/web/src/pages/ReportsPage.tsx`

Local/CI:

- `docker-compose.yml`
- `.github/workflows/ci.yml`
- `.env.example`
- `apps/api/.env.example`
- `apps/web/.env.example`

