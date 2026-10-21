import assert from "node:assert/strict";
import validation from "../.test-build/lib/validation/deployment-event.js";
import signature from "../.test-build/lib/webhooks/signature.js";
import policy from "../.test-build/lib/webhooks/deployment-policy.js";

const { deploymentEventSchema } = validation;
const { signBody, verifyBodySignature } = signature;
const { mayAdvanceDeployment } = policy;
let passed = 0;
function test(name, run) {
  run();
  passed += 1;
  console.log(`✓ ${name}`);
}

test("deployment webhook signature is bound to the exact raw body", () => {
  const raw = '{"eventId":"evt-1"}';
  const secret = "test-secret-with-sufficient-length-123";
  const signed = signBody(raw, secret);
  assert.equal(verifyBodySignature(raw, `sha256=${signed}`, secret), true);
  assert.equal(verifyBodySignature(raw, signed, secret), true);
  assert.equal(verifyBodySignature(raw, null, secret), false);
  assert.equal(verifyBodySignature(`${raw} `, signed, secret), false);
  assert.equal(verifyBodySignature(raw, `sha256=${signed.slice(1)}`, secret), false);
  assert.equal(verifyBodySignature(raw, "bad", secret), false);
});

test("deployment webhook payload validates supported enums and ISO timestamps", () => {
  const valid = { eventId: "evt-1", projectSlug: "sample-app", environment: "STAGING", commitSha: "abc123", imageRef: "registry/sample:abc123", status: "RUNNING", occurredAt: "2026-10-21T00:00:00Z" };
  assert.equal(deploymentEventSchema.safeParse(valid).success, true);
  assert.equal(deploymentEventSchema.safeParse({ ...valid, status: "DEPLOYED" }).success, false);
  assert.equal(deploymentEventSchema.safeParse({ ...valid, occurredAt: "yesterday" }).success, false);
  assert.equal(deploymentEventSchema.safeParse({ ...valid, projectSlug: "Invalid Slug" }).success, false);
  assert.equal(deploymentEventSchema.safeParse({ ...valid, runAttempt: 0 }).success, false);
  assert.equal(deploymentEventSchema.safeParse({ ...valid, eventId: "" }).success, false);
});

test("deployment transition policy blocks regressions, terminal reversions, and stale events", () => {
  assert.equal(mayAdvanceDeployment("PENDING", null, "RUNNING", "2026-10-21T00:00:01Z"), true);
  assert.equal(mayAdvanceDeployment("PENDING", null, "SUCCEEDED", "2026-10-21T00:00:01Z"), true);
  assert.equal(mayAdvanceDeployment("RUNNING", "2026-10-21T00:00:02Z", "PENDING", "2026-10-21T00:00:03Z"), false);
  assert.equal(mayAdvanceDeployment("RUNNING", "2026-10-21T00:00:02Z", "SUCCEEDED", "2026-10-21T00:00:01Z"), false);
  assert.equal(mayAdvanceDeployment("SUCCEEDED", "2026-10-21T00:00:02Z", "RUNNING", "2026-10-21T00:00:03Z"), false);
  assert.equal(mayAdvanceDeployment("FAILED", "2026-10-21T00:00:02Z", "CANCELLED", "2026-10-21T00:00:03Z"), false);
});

console.log(`${passed} webhook checks passed.`);
