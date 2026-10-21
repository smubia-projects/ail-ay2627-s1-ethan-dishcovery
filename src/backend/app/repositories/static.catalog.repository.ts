import type { Catalog, CatalogRepository } from "./catalog.repository";

/** Serves a catalog loaded once at startup from the data/ files. There is no database. */
export function staticCatalogRepository(catalog: Catalog): CatalogRepository {
  return { loadCatalog: async () => catalog };
}
