# ShipIt demo presentation

## 1. Problem and goal

Show the deployment workflow in one place: source change, immutable container,
approved rollout, health result, and recovery.

## 2. Requirements and architecture

Walk through the control plane and sample-app deployment boundary in
[`architecture.md`](architecture.md). Emphasize that ShipIt does not hold
Kubernetes administrator credentials.

## 3. Technology and data model

Show Next.js App Router, Clerk, PostgreSQL/Prisma, Docker, Kubernetes, GHCR, and
GitHub Actions. Trace Project → Environment → Deployment → DeploymentEvent.

## 4. Authentication and authorization

Sign in, create a project, and show that project reads and mutations are scoped
to the authenticated Clerk user ID.

## 5. Docker and Kubernetes

Show the multi-stage dashboard image and sample-app image, then inspect the
sample-app Deployment, Service, resource limits, security context, and probes.

## 6. CI/CD

Open the CI run: checks pass, both images publish with commit tags, and the
sample app is deployed by digest only after the `production` Environment gate.

## 7. Deployment, health, and rollback

Show the sample app `/health` response and the matching signed deployment event
in ShipIt. Demonstrate recovery with
`kubectl -n shipit-demo rollout undo deployment/sample-app`, then inspect
rollout status. The dashboard's rollback action currently records a request;
the operator runs the cluster rollback command.

## 8. Security and troubleshooting

Cover HMAC verification and duplicate event handling, owner-scoped queries,
secret references, GHCR digest pinning, namespace-scoped credentials, and
rollout diagnostics from the deployment script.

## 9. Lessons and next steps

The MVP proves the delivery path locally. Future work can dispatch rollback
requests from the dashboard, poll external app health, adopt short-lived
Kubernetes identity, and add a public ingress with TLS.
