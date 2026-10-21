import "dotenv/config";
import { randomUUID } from "node:crypto";
import { signBody } from "../lib/webhooks/signature";
import { deploymentEventSchema } from "../lib/validation/deployment-event";

const secret = process.env.SHIPIT_WEBHOOK_SECRET;
const url = process.env.SHIPIT_WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/deployments";
const projectSlug = process.env.SHIPIT_TEST_PROJECT_SLUG;

if (!secret || secret.length < 32) throw new Error("Set SHIPIT_WEBHOOK_SECRET to a configured secret (at least 32 characters).");
if (!projectSlug) throw new Error("Set SHIPIT_TEST_PROJECT_SLUG to an existing project slug.");

const payload = deploymentEventSchema.parse({
  eventId: randomUUID(),
  projectSlug,
  environment: process.env.SHIPIT_TEST_ENVIRONMENT ?? "DEVELOPMENT",
  commitSha: process.env.SHIPIT_TEST_COMMIT_SHA ?? randomUUID().replaceAll("-", "").slice(0, 40),
  imageRef: process.env.SHIPIT_TEST_IMAGE_REF ?? "ghcr.io/example/shipit:test",
  status: process.env.SHIPIT_TEST_STATUS ?? "SUCCEEDED",
  message: "Local webhook verification event",
  occurredAt: new Date().toISOString(),
  runId: randomUUID(),
  runAttempt: 1,
});
const rawBody = JSON.stringify(payload);

async function main() {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shipit-signature": `sha256=${signBody(rawBody, secret!)}` },
    body: rawBody,
  });
  const responseText = await response.text();
  let summary = "Response received.";
  try {
    const parsed: unknown = JSON.parse(responseText);
    if (parsed && typeof parsed === "object" && "ok" in parsed) summary = `ok: ${String(parsed.ok)}`;
    else if (parsed && typeof parsed === "object" && "error" in parsed) summary = `error: ${String(parsed.error)}`;
  } catch {
    summary = "Response was not JSON.";
  }
  console.log(`HTTP ${response.status} — ${summary}`);
  if (!response.ok) process.exitCode = 1;
}

void main().catch(() => {
  console.error("The test event could not be sent.");
  process.exitCode = 1;
});
