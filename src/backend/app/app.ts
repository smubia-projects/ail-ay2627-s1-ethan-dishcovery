import cors from "cors";
import express from "express";
import type { Coupon } from "@ail/shared";
import { demoCouponRoutes } from "./api/demo-coupons.routes";
import { errorHandler } from "./api/errors";
import { matchRoutes } from "./api/match.routes";
import type { CatalogRepository } from "./repositories/catalog.repository";

export interface AppOptions {
  /** When given, GET /api/demo/coupons is served. Leave out to keep demo coupons off. */
  demoCoupons?: Coupon[];
}

/** API only: the site is deployed separately (Vercel), so only the listed origins may call it. */
export function createApp(repo: CatalogRepository, corsOrigins: string[], options: AppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "20kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", matchRoutes(repo));
  if (options.demoCoupons !== undefined) app.use("/api", demoCouponRoutes(repo, options.demoCoupons));
  app.use(errorHandler);
  return app;
}
