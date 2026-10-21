# Shiplt

Shiplt is a Next.js app with Clerk authentication.

## Development

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
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

## Deployment webhooks

`POST /api/webhooks/deployments` accepts JSON signed with HMAC-SHA256 over the
exact raw request body. Send the lowercase hexadecimal digest in
`X-ShipIt-Signature`, optionally prefixed with `sha256=`. Configure
`SHIPIT_WEBHOOK_SECRET` to the same secret used by the sender.

To send a local test event, create a project first, then set
`SHIPIT_TEST_PROJECT_SLUG` and run:

```bash
pnpm send:test-event
```

The script uses `http://localhost:3000/api/webhooks/deployments` by default.
Set `SHIPIT_WEBHOOK_URL` to another endpoint as needed. If a sender outside
your machine needs to reach a local development server, run an approved
public tunnel and set `SHIPIT_WEBHOOK_URL` to its HTTPS forwarding URL. Do not
put the webhook secret in the URL or commit it.

Events with a `runId` are grouped into one deployment. If omitted, ShipIt uses
the commit SHA and run attempt as a fallback grouping key. A deployment moves
from pending to running to a terminal status; older events and status regressions
remain in the timeline without changing the current status.

Configure the Clerk webhook sender for `/api/webhooks/clerk` and set its signing
secret in `CLERK_WEBHOOK_SIGNING_SECRET`.

Run the repository's dependency-free webhook checks with `pnpm test`.
