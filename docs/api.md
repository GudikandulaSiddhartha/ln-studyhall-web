# API Documentation

Base URL: `/api`

## Auth

### `POST /auth/register`

```json
{
  "name": "Aditi Sharma",
  "email": "aditi@example.com",
  "phone": "8555227719",
  "password": "securePassword123"
}
```

Returns JWT token and user profile.

### `POST /auth/login`

```json
{
  "email": "aditi@example.com",
  "password": "securePassword123"
}
```

Returns JWT token and user profile.

## Branches

### `GET /branches`

Returns all branches with seats and photos.

### `POST /branches`

Admin only. Creates a branch.

## Bookings

### `GET /bookings/availability?branchId=...&startAt=...&endAt=...`

Returns seat availability for a time range.

### `POST /bookings`

Requires Bearer token.

```json
{
  "branchId": "branch_id",
  "seatId": "seat_id",
  "startAt": "2026-05-11T06:00:00.000Z",
  "endAt": "2026-05-11T14:00:00.000Z"
}
```

### `POST /bookings/:id/check-in`

Requires Bearer token. Creates attendance entry and marks booking as checked in.

## Memberships

### `GET /memberships`

Returns active plans.

### `POST /memberships/:id/subscribe`

Requires Bearer token. Activates membership for the authenticated user.

## Admin

### `GET /admin/analytics`

Admin only. Returns users, bookings, branches, and paid revenue.

### `GET /admin/activity`

Admin only. Returns recent bookings, notifications, and chat logs.

## Chat

### `POST /chat`

```json
{
  "locale": "en-IN",
  "prompt": "What is included in the premium plan?"
}
```

Returns chatbot answer and stores a chat log.
