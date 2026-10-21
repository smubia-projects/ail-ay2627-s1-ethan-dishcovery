import type { Coupon, Dish, Venue } from "@ail/shared";

export interface Catalog {
  venues: Venue[];
  dishes: Dish[];
  coupons: Coupon[];
}

export interface CatalogRepository {
  loadCatalog(): Promise<Catalog>;
}
