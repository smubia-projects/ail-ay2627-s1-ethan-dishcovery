/**
 * API entrypoint (Cloud Run and local dev). The catalog is read from the data/ files once at startup and
 * served from memory; there is no database. A bad data file stops the server on purpose, naming the file.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createApp } from "./app";
import { loadConfig } from "./core/config";
import { staticCatalogRepository } from "./repositories/static.catalog.repository";
import { repoDataRoot } from "../scripts/data-root";
import { loadDemoCoupons } from "../scripts/demo-coupons";
import { loadCatalogData } from "../scripts/load-catalog";

const config = loadConfig();
const dataRoot = config.DATA_DIR === undefined ? repoDataRoot : pathToFileURL(`${resolve(config.DATA_DIR)}/`);
const catalog = await loadCatalogData(dataRoot);

// The demo coupons are checked against the catalog when /api/demo/coupons is requested. A mistake there
// makes that one endpoint answer 500 with the reason in the logs, and the search keeps working.
const demoCoupons = config.DEMO_COUPONS === "true" ? await loadDemoCoupons(dataRoot) : undefined;

createApp(staticCatalogRepository(catalog), config.CORS_ORIGINS, { demoCoupons }).listen(config.PORT, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${config.PORT} (${catalog.venues.length} venues, ${catalog.dishes.length} dishes)`);
});
