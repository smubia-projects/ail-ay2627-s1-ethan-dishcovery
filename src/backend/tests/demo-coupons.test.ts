import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app/app";
import { loadConfig } from "../app/core/config";
import type { Catalog, CatalogRepository } from "../app/repositories/catalog.repository";
import { listCoupons } from "../app/services/coupons/listing";
import { repoDataRoot } from "../scripts/data-root";
import { loadCatalogData } from "../scripts/load-catalog";
import { loadDemoCoupons, parseDemoCoupons } from "../scripts/demo-coupons";
import { coupon, dish, venue } from "./fixtures";

const catalog: Catalog = {
  venues: [venue("v1", { name: "Pasta Express", address: "#01-03" }), venue("v2")],
  dishes: [dish("d1", "v1", {}, { name: "Aglio olio" }), dish("d2", "v2", {})],
  coupons: [],
};
const repo: CatalogRepository = { loadCatalog: async () => catalog };

describe("listCoupons", () => {
  it("adds the venue and dish names to each coupon", () => {
    const [row] = listCoupons([coupon("c1", "v1", ["d1"])], catalog.venues, catalog.dishes);
    expect(row).toMatchObject({ venueName: "Pasta Express", venueAddress: "#01-03", dishNames: ["Aglio olio"] });
  });

  it("gives a venue-wide coupon no dish names", () => {
    expect(listCoupons([coupon("c1", "v1")], catalog.venues, catalog.dishes)[0]!.dishNames).toEqual([]);
  });

  it("fails loudly on an unknown venue, an unknown dish, or a dish from another venue", () => {
    expect(() => listCoupons([coupon("c1", "nope")], catalog.venues, catalog.dishes)).toThrow(/unknown venue/);
    expect(() => listCoupons([coupon("c1", "v1", ["nope"])], catalog.venues, catalog.dishes)).toThrow(/unknown dish/);
    expect(() => listCoupons([coupon("c1", "v1", ["d2"])], catalog.venues, catalog.dishes)).toThrow(/another venue/);
  });
});

describe("GET /api/demo/coupons", () => {
  it("is not served unless demo coupons are switched on", async () => {
    const res = await request(createApp(repo, "http://localhost:5173")).get("/api/demo/coupons");
    expect(res.status).toBe(404);
  });

  it("serves demo coupons marked demo: true", async () => {
    const app = createApp(repo, "http://localhost:5173", { demoCoupons: [coupon("c1", "v1")] });
    const res = await request(app).get("/api/demo/coupons");
    expect(res.status).toBe(200);
    expect(res.body.demo).toBe(true);
    expect(res.body.coupons).toHaveLength(1);
  });

  it("returns an error, not a broken offer, when a coupon points at a missing venue", async () => {
    const app = createApp(repo, "http://localhost:5173", { demoCoupons: [coupon("c1", "gone")] });
    const res = await request(app).get("/api/demo/coupons");
    expect(res.status).toBe(500);
  });

  it("keeps the real search working when a demo coupon is broken", async () => {
    const app = createApp(repo, null, { demoCoupons: [coupon("c1", "gone")] });
    const res = await request(app)
      .post("/api/match")
      .send({ profile: { conditions: [], sodiumPreset: null, limits: {}, halalOnly: false, vegetarianOnly: false }, origin: null });
    expect(res.status).toBe(200);
    expect(res.body.venues.length).toBeGreaterThan(0);
  });

  it("never puts demo coupons into match results", async () => {
    const app = createApp(repo, "http://localhost:5173", { demoCoupons: [coupon("c1", "v1")] });
    const res = await request(app)
      .post("/api/match")
      .send({ profile: { conditions: [], sodiumPreset: null, limits: {}, halalOnly: false, vegetarianOnly: false }, origin: null });
    expect(JSON.stringify(res.body)).not.toContain("DEMO");
    expect(res.body.venues.every((v: { dishes: Array<{ coupons: unknown[] }> }) => v.dishes.every((d) => d.coupons.length === 0))).toBe(true);
  });
});

describe("demo coupon data", () => {
  it("points every coupon at a real venue and dish, and every code starts with DEMO", async () => {
    const real = await loadCatalogData(repoDataRoot);
    const demo = await loadDemoCoupons(repoDataRoot);
    expect(demo.length).toBeGreaterThan(0);
    expect(() => listCoupons(demo, real.venues, real.dishes)).not.toThrow();
    expect(demo.every((c) => c.code.startsWith("DEMO"))).toBe(true);
  });

  it("includes a venue-wide, a dish-specific and an expired coupon, so every state can be shown", async () => {
    const demo = await loadDemoCoupons(repoDataRoot);
    expect(demo.some((c) => c.dishIds.length === 0)).toBe(true);
    expect(demo.some((c) => c.dishIds.length > 0)).toBe(true);
    expect(demo.some((c) => c.validUntil !== null && c.validUntil < "2026-10-08")).toBe(true);
    expect(demo.some((c) => c.validUntil === null)).toBe(true);
  });

  it("keeps demo coupons out of the real catalog", async () => {
    expect((await loadCatalogData(repoDataRoot)).coupons).toHaveLength(0);
  });

  it("rejects a demo coupon whose code does not start with DEMO", () => {
    expect(() => parseDemoCoupons({ coupons: [{ ...coupon("x", "v1"), code: "REAL10" }] })).toThrow(/DEMO/);
  });
});

describe("config", () => {
  const base = { CORS_ORIGIN: "http://localhost:5173" };
  it("keeps demo coupons off unless set to true", () => {
    expect(loadConfig(base).DEMO_COUPONS).toBe("false");
    expect(loadConfig({ ...base, DEMO_COUPONS: "true" }).DEMO_COUPONS).toBe("true");
    expect(() => loadConfig({ ...base, DEMO_COUPONS: "yes" })).toThrow();
  });
});
