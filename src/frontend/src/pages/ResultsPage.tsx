import { useEffect, useMemo, useState } from "react";
import type { CouponListing, InactiveRule, Profile, VenueMatch } from "@ail/shared";
import { ClosestPanel } from "@/components/ClosestPanel";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { EngagementCta } from "@/components/EngagementCta";
import { MapView } from "@/components/MapView";
import { OriginPicker } from "@/components/OriginPicker";
import { RedeemDialog } from "@/components/RedeemDialog";
import { VenueCard } from "@/components/VenueCard";
import { VenueCouponsDialog } from "@/components/VenueCouponsDialog";
import { Button } from "@/components/ui/button";
import { useDemoCoupons } from "@/hooks/useDemoCoupons";
import { useMatch } from "@/hooks/useMatch";
import { useUsedCoupons } from "@/hooks/useUsedCoupons";
import { recordSuccessfulMatch } from "@/services/engagement";
import { APP_NAME, COUPON_COPY, NUTRIENT_LABELS } from "@/utils/copy";
import { goTo } from "@/utils/hashRoute";
import { PRESET_ORIGINS, type Origin } from "@/utils/origins";

function InactiveNotice({ rules, onEdit }: { rules: InactiveRule[]; onEdit: () => void }) {
  if (rules.length === 0) return null;
  const names = rules.map((r) => NUTRIENT_LABELS[r.nutrient].toLowerCase()).join(", ");
  return (
    <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      We are not checking {names} yet because no limit is set.{" "}
      <button type="button" className="underline" onClick={onEdit}>Add a limit</button>
    </p>
  );
}

/** Exact matches, dishes that could be judged, and dishes missing nutrient data. */
function counts(venues: VenueMatch[]) {
  const dishes = venues.flatMap((v) => v.dishes);
  const unknown = dishes.filter((d) => d.reasons.includes("missing_nutrient_data")).length;
  return { exact: dishes.filter((d) => d.matches).length, checked: dishes.length - unknown, unknown };
}

export function ResultsPage({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const [origin, setOrigin] = useState<Origin>(PRESET_ORIGINS[0]!);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const state = useMatch(profile, origin);
  const [ctaCount, setCtaCount] = useState<number | null>(null);

  // Each successful search counts towards the engagement CTA, which opens once after a few.
  useEffect(() => {
    if (state.status !== "ready") return;
    const count = recordSuccessfulMatch();
    if (count !== null) setCtaCount(count);
  }, [state]);
  const tally = state.status === "ready" ? counts(state.data.venues) : { exact: 0, checked: 0, unknown: 0 };

  const demo = useDemoCoupons();
  const { used, markUsed } = useUsedCoupons();
  const [couponVenueId, setCouponVenueId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<CouponListing | null>(null);

  const couponsByVenue = useMemo(() => {
    const map = new Map<string, CouponListing[]>();
    if (demo.status !== "ready") return map;
    for (const l of demo.data.coupons) map.set(l.coupon.venueId, [...(map.get(l.coupon.venueId) ?? []), l]);
    return map;
  }, [demo]);

  /** Choosing a different place highlights it and, if it has demo coupons, opens them. */
  const select = (venueId: string) => {
    const changed = venueId !== selectedId;
    setSelectedId(venueId);
    document.getElementById(`venue-${venueId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (changed && couponsByVenue.has(venueId)) setCouponVenueId(venueId);
  };

  const couponVenueName =
    couponVenueId === null ? null : (couponsByVenue.get(couponVenueId)?.[0]?.venueName ?? null);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-2">
      <div className="space-y-3 md:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">{APP_NAME}</p>
            <h1 className="text-xl font-semibold">Places that match your limits</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => goTo("coupons-demo")}>Coupons demo</Button>
            <Button variant="outline" size="sm" onClick={onEdit}>Edit profile</Button>
          </div>
        </div>
        <OriginPicker value={origin} onChange={setOrigin} />
        <DisclaimerBanner />
        {demo.status === "error" && <p role="alert" className="text-sm text-destructive">{COUPON_COPY.loadFailed} {demo.message}</p>}
      </div>

      {state.status === "loading" && <p>Finding places...</p>}
      {state.status === "error" && <p role="alert" className="text-destructive">{state.message}</p>}
      {state.status === "ready" && (
        <>
          <div className="space-y-3 md:order-2">
            <MapView origin={origin} venues={state.data.venues} selectedId={selectedId} onSelect={select} />
          </div>
          <div className="space-y-3 md:order-1">
            <InactiveNotice rules={state.data.inactiveRules} onEdit={onEdit} />
            <ClosestPanel
              closest={state.data.closest}
              venues={state.data.venues}
              exactCount={tally.exact}
              checkedCount={tally.checked}
              unknownCount={tally.unknown}
              onSelect={select}
            />
            {state.data.venues.length === 0 && <p>No venues found.</p>}
            {state.data.venues.map((v) => (
              <VenueCard
                key={v.venue.id}
                match={v}
                selected={v.venue.id === selectedId}
                onSelect={select}
                demoCouponCount={couponsByVenue.get(v.venue.id)?.length ?? 0}
                onOpenCoupons={() => setCouponVenueId(v.venue.id)}
              />
            ))}
          </div>
        </>
      )}

      <VenueCouponsDialog
        venueName={couponVenueName}
        listings={couponVenueId === null ? [] : (couponsByVenue.get(couponVenueId) ?? [])}
        used={used}
        onShow={(l) => {
          setCouponVenueId(null);
          setRedeeming(l);
        }}
        onClose={() => setCouponVenueId(null)}
      />
      <RedeemDialog listing={redeeming} onClose={() => setRedeeming(null)} onMarkUsed={markUsed} />
      <EngagementCta count={ctaCount} onDismiss={() => setCtaCount(null)} />
    </div>
  );
}
