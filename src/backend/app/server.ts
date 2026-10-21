import { createApp } from "./app";
import { loadConfig } from "./core/config";
import { staticCatalogRepository } from "./repositories/static.catalog.repository";
import { repoDataRoot } from "../scripts/data-root";
import { loadDemoCoupons } from "../scripts/demo-coupons";
import { loadCatalogData } from "../scripts/load-catalog";

const config = loadConfig();
const catalog = await loadCatalogData(repoDataRoot);
const demoCoupons = config.DEMO_COUPONS === "true" ? await loadDemoCoupons(repoDataRoot) : undefined;
createApp(staticCatalogRepository(catalog), config.CORS_ORIGIN, { demoCoupons }).listen(config.PORT, () => {
  console.log(`API listening on :${config.PORT}`);
});
