# KalyanPawnBrokers

Secure multi-tenant loan management application built with Next.js and MongoDB.

## Security Features Included

- JWT auth with HTTP-only cookies
- Owner and User role-based access control
- Tenant data isolation using `userId` scoping in all business APIs
- Password hashing with `bcryptjs`
- Route protection via `proxy.ts` for pages and APIs
- Input validation and sanitization in APIs
- In-memory rate limiting on sensitive endpoints
- Safe API error handling with no-store cache headers
- Database indexes for auth + tenant-aware query performance
- Owner user management (create user, list users, reset user password)

## Required Environment Variables

Create `.env.local`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
JWT_SECRET=replace-with-a-long-random-secret
OWNER_BOOTSTRAP_SECRET=replace-with-an-owner-bootstrap-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
APPLICATION_MAIL=your-mailbox@example.com
APPLICATION_MAIL_PASSWORD=your-mail-password-or-app-password
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
MAIL_FROM=KalyanPawnBrokers <no-reply@example.com>
```

## Install and Run

```bash
npm install
npm run dev
```

## First-Time Owner Bootstrap

This endpoint works only when there is no owner account yet.

<!-- `POST /api/auth/bootstrap-owner`

Example body:

```json
{
  "name": "Owner Name",
  "email": "owner@example.com",
  "password": "StrongPass123!",
  "bootstrapSecret": "same-as-OWNER_BOOTSTRAP_SECRET"
}
``` -->

After creating owner:
1. Login at `/login`
2. Go to `/settings`
3. Create application users and share their login credentials

## Multi-Tenant Behavior

- Each user can access only their own clients, loans, and payments.
- One user cannot read or modify another user’s records.
- Owner manages users, but business data remains tenant-scoped per logged-in user.

## Notes

- Existing records created before this auth update may not contain `userId`; create fresh records after login for proper isolation.
- For production, use a strong `JWT_SECRET` and HTTPS.
