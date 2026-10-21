/**
 * Client-side counter for the engagement CTA. It counts successful dish searches in localStorage and
 * says when to show the CTA: once, after the third. It never limits anything; the demo keeps working.
 * Keys use the project's full folder name, the club's slug standard.
 */
export const ENGAGEMENT_SLUG = "ail-ay2627-s1-ethan-dishcovery";
export const CTA_THRESHOLD = 3;

const COUNT_KEY = `${ENGAGEMENT_SLUG}:matches`;
const SHOWN_KEY = `${ENGAGEMENT_SLUG}:cta-shown`;

/**
 * Records one successful search. Returns the running count when the CTA should open now, otherwise null.
 * Storage can be unavailable (private mode, blocked site data); then the CTA simply never shows.
 */
export function recordSuccessfulMatch(storage: Storage | undefined = globalThis.localStorage): number | null {
  if (storage === undefined) return null;
  try {
    const count = (Number.parseInt(storage.getItem(COUNT_KEY) ?? "0", 10) || 0) + 1;
    storage.setItem(COUNT_KEY, String(count));
    if (count < CTA_THRESHOLD || storage.getItem(SHOWN_KEY) === "true") return null;
    storage.setItem(SHOWN_KEY, "true");
    return count;
  } catch (err) {
    console.warn("Engagement counter unavailable; the CTA will not show", err);
    return null;
  }
}
