import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const currentBaseUrl = new URL(
  process.env.CURRENT_PRODUCTION_URL?.trim() || "https://www.swaply.world",
);
const rollbackBaseUrl = new URL(
  process.env.ROLLBACK_CANDIDATE_URL?.trim() ||
    "https://swaply-2025-i3oa29f7x-petrus-projects-d4a0946c.vercel.app",
);
const evidenceDirectory = resolve(
  process.cwd(),
  process.env.OPERATIONS_EVIDENCE_DIR?.trim() || "operations-evidence",
);
const routes = ["/en", "/en/login", "/en/explore"];
const timeoutMs = Number(process.env.REHEARSAL_TIMEOUT_MS || 20_000);

for (const candidate of [currentBaseUrl, rollbackBaseUrl]) {
  if (candidate.protocol !== "https:") {
    throw new Error(`Rehearsal URL must use HTTPS: ${candidate.origin}`);
  }
}

async function inspectRoute(baseUrl, route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(new URL(route, baseUrl), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Swaply-V1-10-Operations-Rehearsal/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const body = await response.arrayBuffer();
    const elapsedMs = Math.round(performance.now() - startedAt);
    const bodyHash = createHash("sha256").update(Buffer.from(body)).digest("hex");

    if (response.status < 200 || response.status >= 400) {
      throw new Error(`${baseUrl.origin}${route} returned HTTP ${response.status}.`);
    }

    return {
      route,
      status: response.status,
      contentType: response.headers.get("content-type") || "unknown",
      finalOrigin: new URL(response.url).origin,
      bodyBytes: body.byteLength,
      bodySha256: bodyHash,
      elapsedMs,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function inspectDeployment(label, baseUrl) {
  const results = [];
  for (const route of routes) {
    results.push(await inspectRoute(baseUrl, route));
  }
  return {
    label,
    origin: baseUrl.origin,
    routes: results,
  };
}

function sign(secret, payload) {
  return createHmac("sha256", secret).update(payload).digest();
}

function verify(secret, payload, signature) {
  const expected = sign(secret, payload);
  return expected.length === signature.length && timingSafeEqual(expected, signature);
}

function simulateSecretRotation() {
  const oldSecret = randomBytes(32);
  const newSecret = randomBytes(32);
  const payload = "swaply:v1-10:rotation-rehearsal";
  const oldSignature = sign(oldSecret, payload);
  const newSignature = sign(newSecret, payload);

  const beforeRotation = {
    oldCredentialAccepted: verify(oldSecret, payload, oldSignature),
    newCredentialAcceptedPrematurely: verify(newSecret, payload, oldSignature),
  };
  const afterRotation = {
    newCredentialAccepted: verify(newSecret, payload, newSignature),
    oldCredentialRejected: !verify(newSecret, payload, oldSignature),
  };

  if (
    !beforeRotation.oldCredentialAccepted ||
    beforeRotation.newCredentialAcceptedPrematurely ||
    !afterRotation.newCredentialAccepted ||
    !afterRotation.oldCredentialRejected
  ) {
    throw new Error("Secret-rotation rehearsal did not preserve the expected cutover boundary.");
  }

  return {
    algorithm: "HMAC-SHA256",
    mode: "EPHEMERAL_SIMULATION_NO_REAL_SECRET",
    beforeRotation,
    afterRotation,
  };
}

const current = await inspectDeployment("current-production", currentBaseUrl);
const rollbackCandidate = await inspectDeployment(
  "immutable-rollback-candidate",
  rollbackBaseUrl,
);
const secretRotation = simulateSecretRotation();

const stableEvidence = {
  contractVersion: "1.0.0",
  package: "V1-10.2",
  mode: "NON_DESTRUCTIVE_OPERATIONS_REHEARSAL",
  current,
  rollbackCandidate,
  secretRotation,
  guarantees: {
    productionAliasChanged: false,
    productionDatabaseWritten: false,
    realSecretReadOrRotated: false,
    pageBodiesStored: false,
    providerActivated: false,
  },
};
const manifestSha256 = createHash("sha256")
  .update(JSON.stringify(stableEvidence))
  .digest("hex");
const evidence = {
  ...stableEvidence,
  generatedAt: new Date().toISOString(),
  manifestSha256,
};

await mkdir(evidenceDirectory, { recursive: true });
await writeFile(
  resolve(evidenceDirectory, "operations-rehearsal.json"),
  `${JSON.stringify(evidence, null, 2)}\n`,
  "utf8",
);

const routeLines = [current, rollbackCandidate].flatMap((deployment) => [
  `### ${deployment.label}`,
  "",
  `Origin: \`${deployment.origin}\``,
  "",
  ...deployment.routes.map(
    (route) =>
      `- \`${route.route}\`: HTTP \`${route.status}\`, ${route.bodyBytes} bytes, SHA-256 \`${route.bodySha256}\`, ${route.elapsedMs} ms`,
  ),
  "",
]);

const markdown = [
  "# V1-10.2 Operations rehearsal evidence",
  "",
  `- Manifest SHA-256: \`${manifestSha256}\``,
  "- Mode: `NON_DESTRUCTIVE_OPERATIONS_REHEARSAL`",
  "- Production alias changed: `false`",
  "- Production database written: `false`",
  "- Real secret read or rotated: `false`",
  "- Page bodies stored: `false`",
  "- Provider activated: `false`",
  "",
  "## Immutable deployment smoke",
  "",
  ...routeLines,
  "## Secret-rotation simulation",
  "",
  `- Algorithm: \`${secretRotation.algorithm}\``,
  `- Old credential accepted before cutover: \`${secretRotation.beforeRotation.oldCredentialAccepted}\``,
  `- New credential accepted prematurely: \`${secretRotation.beforeRotation.newCredentialAcceptedPrematurely}\``,
  `- New credential accepted after cutover: \`${secretRotation.afterRotation.newCredentialAccepted}\``,
  `- Old credential rejected after cutover: \`${secretRotation.afterRotation.oldCredentialRejected}\``,
  "",
].join("\n");
await writeFile(
  resolve(evidenceDirectory, "operations-rehearsal.md"),
  markdown,
  "utf8",
);

console.log(`V1-10.2 operations rehearsal complete: ${manifestSha256}`);
