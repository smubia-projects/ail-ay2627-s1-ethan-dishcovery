/**
 * Smoke test for a running API. Usage: `npm run smoke:api -- https://<cloud-run-url>`
 * (defaults to http://127.0.0.1:8080). Checks health, a match, a bad request and an unknown path.
 * Exits non-zero on the first problem.
 */
const base = (process.argv[2] ?? "http://127.0.0.1:8080").replace(/\/+$/, "");

function check(ok, message) {
  if (!ok) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`ok   ${message}`);
}

const health = await fetch(`${base}/api/health`);
check(health.status === 200 && (await health.json()).status === "ok", "GET /api/health returns {status: ok}");

const profile = { conditions: ["hypertension"], sodiumPreset: "singapore_2000", limits: {}, halalOnly: false, vegetarianOnly: false };
const match = await fetch(`${base}/api/match`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ profile, origin: { lat: 1.2956, lng: 103.8492 } }),
});
const matchBody = await match.json();
check(match.status === 200, "POST /api/match returns 200");
check(Array.isArray(matchBody.venues) && matchBody.venues.length > 0, `match returns venues (${matchBody.venues?.length})`);
check(Array.isArray(matchBody.closest), "match returns a closest list");

const bad = await fetch(`${base}/api/match`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ profile: { conditions: ["flu"] }, origin: null }),
});
check(bad.status === 400, "an invalid profile is rejected with 400");

const demo = await fetch(`${base}/api/demo/coupons`);
check(demo.status === 200 || demo.status === 404, `GET /api/demo/coupons answers ${demo.status} (200 when DEMO_COUPONS=true, else 404)`);

const missing = await fetch(`${base}/api/does-not-exist`);
check(missing.status === 404, "an unknown API path returns 404");

console.log("All smoke checks passed.");
