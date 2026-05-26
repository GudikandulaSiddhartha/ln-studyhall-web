# LN StudyHall

A premium full-stack study hall booking and information platform with animated marketing pages, dashboards, booking flows, maps, memberships, AI assistant UI, and a secure Express plus Prisma backend.

## Stack

- Next.js 15, TypeScript, TailwindCSS, Framer Motion, GSAP, Recharts
- Node.js, Express.js, Prisma ORM, PostgreSQL
- JWT-ready auth service, Google OAuth extension points, rate limiting, validation, secure password hashing
- Deployment targets: Vercel for `apps/web`, Railway or AWS for `apps/api`, Cloudinary for media

## Quick Start

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run prisma:generate
npm run dev:api
npm run dev:web
```

The web app defaults to `http://localhost:3000`. The API defaults to `http://localhost:4000`.

## Structure

```txt
apps/
  api/
    prisma/schema.prisma
    src/controllers
    src/middleware
    src/routes
    src/services
  web/
    app
    components
    lib
docs/
  api.md
  deployment.md
  architecture.md
```

## Production Notes

1. Create PostgreSQL on Railway or AWS RDS and set `DATABASE_URL`.
2. Configure Google OAuth credentials and JWT secrets.
3. Configure Cloudinary credentials for admin gallery uploads.
4. Deploy `apps/api` first, then set `NEXT_PUBLIC_API_URL` in Vercel.
5. Run `npm run prisma:migrate` from `apps/api`.

