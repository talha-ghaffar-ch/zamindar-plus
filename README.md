# Zamindar Plus

Zamindar Plus is a local-first farm ledger platform for managing profiles, zameen, crops, expenses, income, reports, account settings, email verification, and password reset flows.

## Stack

- Web: React, Vite, TypeScript
- API: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Local runtime: Docker Compose
- Shared package: common area conversion utilities

## Project Structure

```text
zamindar-plus/
  apps/
    api/      NestJS backend
    mobile/   React Native mobile app
    web/      React website
  packages/
    shared/   Shared utilities
  .github/
    workflows/ci.yml
    workflows/deploy-ec2.yml
  docs/
    deployment-ec2-docker.md
```

## Local Setup

Install dependencies from the repository root:

```bash
npm install
```

Create local environment files from the examples:

```bash
copy .env.example .env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Run the API:

```bash
npm run dev:api
```

Run the web app in another terminal:

```bash
npm run dev:web
```

Run the mobile app in another terminal after Android Studio/emulator is ready:

```bash
npm run android:mobile
```

Default local URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Useful Commands

```bash
npm run build:web
npm run lint:web
npm run lint:mobile
npm run build:api
npm run lint:api
npm run test:api
npm run check
```

## Notes

- Production deployment files are included for an EC2 + Docker + RDS setup.
- The real production `.env.production` file must stay on the server and must never be committed.
- Real email delivery requires SMTP values in `apps/api/.env`.
- Google sign-in requires matching frontend and backend Google OAuth client IDs in local env files.
