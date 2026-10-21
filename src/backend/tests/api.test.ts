import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app/app";
import { loadConfig } from "../app/core/config";
import type { Catalog, CatalogRepository } from "../app/repositories/catalog.repository";
import { baseProfile, coupon, dish, venue } from "./fixtures";

const catalog: Catalog = {
  venues: [venue("v1")],
  dishes: [dish("d1", "v1", { sodium_mg: 300 })],
  coupons: [coupon("c1", "v1")],
};
const repo: CatalogRepository = { loadCatalog: async () => catalog };
const app = createApp(repo, ["http://localhost:5173"]);

describe("GET /api/health", () => {
  it("answers {status: ok}", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/match", () => {
  it("returns ranked venues for a valid profile", async () => {
    const res = await request(app)
      .post("/api/match")
      .send({ profile: { ...baseProfile, sodiumPreset: "singapore_2000" }, origin: { lat: 1.28, lng: 103.85 } });
    expect(res.status).toBe(200);
    expect(res.body.venues[0].matchedCount).toBe(1);
    expect(res.body.venues[0].dishes[0].coupons).toHaveLength(1);
  });

  it("rejects an invalid body with 400", async () => {
    const res = await request(app).post("/api/match").send({ profile: { conditions: ["flu"] }, origin: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_request");
  });
});

describe("loadConfig", () => {
  it("fails when required env vars are missing", () => {
    expect(() => loadConfig({})).toThrow();
  });

  it("splits CORS_ORIGINS on commas and defaults PORT to 8080", () => {
    const config = loadConfig({ CORS_ORIGINS: "https://a.vercel.app, http://localhost:5173" });
    expect(config.CORS_ORIGINS).toEqual(["https://a.vercel.app", "http://localhost:5173"]);
    expect(config.PORT).toBe(8080);
  });
});
