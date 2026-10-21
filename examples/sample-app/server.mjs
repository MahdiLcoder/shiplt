import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8080);
const version = process.env.APP_VERSION ?? "local";

createServer((request, response) => {
  if (request.url === "/health" || request.url === "/healthz") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", version }));
    return;
  }

  if (request.url === "/version") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ version }));
    return;
  }

  if (request.url !== "/") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShipIt Sample App</title><body style="font:16px system-ui;max-width:42rem;margin:12vh auto;padding:0 1.5rem;color:#14251f"><p style="color:#16745b;font-weight:700">SHIPIT SAMPLE APPLICATION</p><h1>From commit to deployment.</h1><p>This app is deployed by the ShipIt delivery pipeline.</p><p>Running version: <code>${escapeHtml(version)}</code></p><p><a href="/health">Health</a> · <a href="/version">Version</a></p></body></html>`);
}).listen(port, "0.0.0.0", () => {
  console.log(`Sample app listening on ${port} (${version})`);
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
