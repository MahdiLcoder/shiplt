import { createHmac, timingSafeEqual } from "node:crypto";

export function signBody(rawBody: string, secret: string) {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyBodySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const value = header.startsWith("sha256=") ? header.slice(7) : header;
  if (!/^[a-f0-9]{64}$/i.test(value)) return false;
  const expected = Buffer.from(signBody(rawBody, secret), "hex");
  const supplied = Buffer.from(value, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}