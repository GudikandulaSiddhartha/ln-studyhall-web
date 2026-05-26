# Architecture

## Overview

LN StudyHall is split into two deployable applications:

- `apps/web`: Next.js 15 application with SSR pages, animated client components, dashboards, booking UX, branch map UI, and LN AI Assistant.
- `apps/api`: Express API with Prisma ORM, PostgreSQL, JWT authentication, validation, rate limiting, and admin endpoints.

## Frontend Modules

- `app/page.tsx`: premium landing page composition.
- `components/hero.tsx`: cinematic hero with GSAP page flip book and theme lamp.
- `components/facilities.tsx`: animated facility cards.
- `components/branch-map.tsx`: branch list, map marker UI, Google navigation links.
- `components/chatbot.tsx`: floating LN AI Assistant with voice input support and typing animation.
- `components/booking-board.tsx`: real-time seat selection concept and QR verification UI.
- `components/analytics-dashboard.tsx`: admin metrics, charts, logs, and chatbot controls.

## Backend Modules

- `auth.routes.ts`: email login/register plus Google OAuth handoff endpoint.
- `branch.routes.ts`: branch listing and admin branch creation.
- `booking.routes.ts`: availability checks, booking creation, QR check-in.
- `membership.routes.ts`: plan listing and subscription activation.
- `admin.routes.ts`: analytics and activity feeds.
- `chat.routes.ts`: chatbot response endpoint and chat log storage.

## Security

- Helmet security headers.
- CORS restricted by `FRONTEND_URL`.
- Rate limiting on all API routes.
- Zod input validation.
- Password hashing with bcrypt.
- Prisma parameterized queries to prevent SQL injection.
- JWT authentication middleware and admin role guard.

## Scaling Path

- Add Redis for booking locks and rate limit storage.
- Add queue workers for notification delivery.
- Store images in Cloudinary with signed upload presets.
- Add Auth.js on `apps/web` for Google OAuth session management.
- Add read replicas for analytics once traffic grows.
