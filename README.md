# Shiplt

Shiplt is a Next.js app with Clerk authentication.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

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

The app uses Prisma ORM 8 with PostgreSQL. Copy `.env.example` to `.env` and
set `DATABASE_URL` to your PostgreSQL connection string. Keep the connection
string private; `.env` is ignored by Git.

The data contract lives in `prisma/contract.prisma`. After changing it, emit
the generated contract files:

```bash
pnpm prisma contract emit
```

There is no automatic contract-emission plugin for Next.js in this project.
The `prebuild` script emits the contract before production builds; during
development, run the command manually after contract changes. Initialize the
database with `pnpm prisma db init` only after configuring a real
`DATABASE_URL`.
