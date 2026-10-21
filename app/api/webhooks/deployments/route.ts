import { env } from "../../../../lib/env";
import { processDeploymentEvent } from "../../../../lib/data/deployments";
import { deploymentEventSchema } from "../../../../lib/validation/deployment-event";
import { verifyBodySignature } from "../../../../lib/webhooks/signature";

export async function POST(request: Request) {
  if (!env.SHIPIT_WEBHOOK_SECRET || env.SHIPIT_WEBHOOK_SECRET.length < 32) {
    return Response.json({ error: "Deployment webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyBodySignature(rawBody, request.headers.get("x-shipit-signature"), env.SHIPIT_WEBHOOK_SECRET)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Malformed JSON." }, { status: 400 });
  }
  const parsed = deploymentEventSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid deployment event." }, { status: 400 });

  try {
    const result = await processDeploymentEvent(parsed.data);
    if (result.kind === "project-not-found") return Response.json({ error: "Project not found." }, { status: 404 });
    if (result.kind === "environment-not-found") return Response.json({ error: "Environment not found." }, { status: 404 });
    return Response.json({ ok: true, duplicate: result.kind === "duplicate" });
  } catch {
    return Response.json({ error: "The deployment event could not be processed." }, { status: 500 });
  }
}
