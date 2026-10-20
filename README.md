# Shiplt

Shiplt is a Next.js app with Clerk authentication.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Set `DATABASE_URL` in the root `.env` before installing dependencies; the
`postinstall` script generates Prisma Client.

Open [http://localhost:3000](http://localhost:3000). The Clerk CLI manages the
development credentials in `.env.local`; keep that file private and do not
commit it.

## Authentication

- `/sign-up` provides account creation.
- `/sign-in` provides sign-in.
- Development supports email verification codes, Google, and GitHub sign-in.
- The home page shows sign-in and sign-up links when signed out, and the Clerk
  profile control when signed in.
- Routes are public by default. Protect each page, Route Handler, and Server
  Action that requires authentication with `await auth.protect()`.

For production, configure a production Clerk instance and credentials before
deploying.

## Database

The app uses Prisma ORM 7 with PostgreSQL. Set `DATABASE_URL` to your
PostgreSQL TCP connection string in the root `.env` file; `.env*` files are
ignored by Git. Keep the connection string private.

Generate Prisma Client and verify the connection:

```bash
npx prisma generate
npm run db:test
```

Use `npm run db:studio` to open Prisma Studio. Inspect an existing database
before applying schema changes.
