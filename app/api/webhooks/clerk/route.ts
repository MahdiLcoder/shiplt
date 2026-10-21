import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { env } from "../../../../lib/env";
import { archiveClerkUserProjects, recordClerkLifecycleEvent } from "../../../../lib/data/lifecycle";

export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request, { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET });
  } catch {
    return Response.json({ error: "Invalid webhook signature or payload." }, { status: 401 });
  }

  const eventId = request.headers.get("svix-id");
  if (!eventId) return Response.json({ error: "Missing event identifier." }, { status: 400 });
  const userId = "id" in event.data && typeof event.data.id === "string" ? event.data.id : null;
  if (!userId) return Response.json({ error: "Invalid user event." }, { status: 400 });

  try {
    switch (event.type) {
      case "user.deleted":
        await archiveClerkUserProjects(userId, eventId);
        return Response.json({ ok: true });
      case "user.created":
      case "user.updated":
        await recordClerkLifecycleEvent(userId, eventId, `clerk.${event.type.replace(".", "_")}`);
        return Response.json({ ok: true });
      default:
        return Response.json({ error: "Unsupported event type." }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "The lifecycle event could not be processed." }, { status: 500 });
  }
}
