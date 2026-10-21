# ShipIt

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
pnpm exec prisma contract emit
```

There is no automatic contract-emission plugin for Next.js in this project.
The `prebuild` script emits the contract before production builds; during
development, run the command manually after contract changes. Initialize the
database with `pnpm exec prisma db init` only after configuring a real
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

The dashboard keeps its summary counts exact while loading only the latest
eight deployments per project for recent activity. Project deployment and audit
views are bounded to the latest 100 records, and deployment detail pages load
their event timeline directly for the selected deployment (up to the latest
100 events). Historical deployments remain stored in the database.

For a manual local check, start the app with `pnpm dev`, create a project with
the `development` environment, then send a signed event with
`SHIPIT_TEST_PROJECT_SLUG=<project-slug> pnpm send:test-event`. Check the
project overview, deployment history, event detail page, and activity page.

## Run with Docker Compose

Docker Compose uses the existing `.env` file; no separate Compose env file is
needed. Copy `.env.example` to `.env` once if you have not already done so, then
put your Clerk keys and webhook secrets in `.env`. Do not commit that file.
The public Clerk publishable key is used during the image build; the secret keys
are supplied to the running container only.

Build the app image and start it with a local PostgreSQL database:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Compose waits for
PostgreSQL to report healthy before starting ShipIt, and the app exposes
`/api/health` for a simple container health check. Inside Compose, the app uses
the `db` service name for PostgreSQL. Your `.env` remains unchanged and can
continue to use `localhost` for running ShipIt directly on your computer.

Database migrations are not run automatically. After the image has been built,
apply the repository's migrations explicitly with:

```bash
docker compose run --rm app pnpm migrate
```

Useful commands:

```bash
docker compose logs -f app       # Follow app logs
docker compose ps                # Check service and health status
docker compose down              # Stop services; keep database data
```

To delete the local database and start with an empty one, run
`docker compose down --volumes`. **This permanently deletes the PostgreSQL data
stored by this Compose project.**

The Compose PostgreSQL credentials are fixed local development values and must
not be reused in production.

## GitHub Actions and GHCR

The `CI` workflow runs lint, type checks, tests, and a production build on pull
requests and pushes to `main` or version tags. After those checks pass, pushes
to `main` and `v*` tags publish the dashboard image to
`ghcr.io/<owner>/<repository>` and the controlled sample app to
`ghcr.io/<owner>/<repository>-sample-app`. Both images have an immutable
`sha-<commit>` tag; `latest` is also updated from `main`, and version tags keep
their release name.

Before image publishing, add the repository Actions variable
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` with the public key for the Clerk instance
used by that image. It is included in the client bundle and is not a secret.
Private Clerk and webhook keys are not passed to the image build. Configure
them at runtime in the deployment platform. GitHub Actions uses its provided
`GITHUB_TOKEN`; the publish job needs package write permission enabled for the
repository. Pull requests never receive package publishing permission.

## Approved sample-app deployment

After verification and GHCR publishing succeed on `main`, the workflow deploys
the sample-app image by its digest to the `production` GitHub Environment.
ShipIt itself is not deployed by this workflow. Version tags publish images
but do not deploy them automatically. Configure these Environment values in
GitHub before enabling the workflow:

- Variables: `SHIPIT_PROJECT_SLUG` (the existing ShipIt project slug) and
  `SHIPIT_WEBHOOK_URL` (the full `/api/webhooks/deployments` endpoint URL).
- Secrets: `KUBECONFIG_B64` (base64 encoded kubeconfig for a restricted deploy
  identity) and `SHIPIT_WEBHOOK_SECRET` (the same HMAC secret configured for
  ShipIt's runtime).

Set required reviewers and deployment branch restrictions on the `production`
Environment in GitHub. A cluster administrator creates the namespace once with
`kubectl apply -f deploy/kubernetes/namespace.yaml` and scopes the deployment
identity to `shipit-demo` and only the permissions needed to update/read the
`sample-app` Deployment and Service, inspect pods, and read pod logs. The
workflow expects `KUBECONFIG_B64`; use the cluster provider's OIDC login action
and short-lived credentials where supported. Make the sample-app GHCR package
pullable by the cluster; for a private package, create an image pull Secret and
reference it in `deploy/kubernetes/app.yaml`.

The target project must already have a `PRODUCTION` environment in ShipIt. The
workflow sends signed `RUNNING` and final `SUCCEEDED` or `FAILED` events using
the existing HMAC webhook contract; retry event IDs are stable for each GitHub
run attempt so ShipIt can safely deduplicate them. If webhook delivery fails
after a successful rollout, reconcile the release record from Kubernetes state
and the GitHub Actions log.

## Kubernetes deployment

The manifests run two sample-app replicas behind an internal ClusterIP
service in the `shipit-demo` namespace. The sample app has no runtime secrets
or database dependency. Create the namespace once:

```bash
kubectl apply -f deploy/kubernetes/namespace.yaml
```

The manifests do not create a public ingress, TLS certificate, or registry
credentials. For a private GHCR package, create an image pull Secret in the
namespace and add its name under `spec.template.spec.imagePullSecrets` in
`app.yaml` before deploying.

Deploy an immutable image published by the workflow:

```bash
./deploy/kubernetes/deploy.sh ghcr.io/OWNER/REPOSITORY-sample-app:sha-COMMIT
```

The script applies the manifests, waits up to three minutes for rollout, then
prints pod, deployment, and container log diagnostics if the rollout fails.
To check the service from inside the cluster, use a temporary port-forward:

```bash
kubectl -n shipit-demo port-forward service/sample-app 8080:8080
```

Open [http://localhost:8080/](http://localhost:8080/) for the app or
[http://localhost:8080/health](http://localhost:8080/health) for its health
response. To restore the previous working Kubernetes revision, run
`kubectl -n shipit-demo rollout undo deployment/sample-app`; inspect the
rollout with `kubectl -n shipit-demo rollout status deployment/sample-app`.
