import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";

/** AI Lodge showcase metadata (same field set as the club's CTA spec). */
export const CTA_PROJECT = {
  name: "Dishcovery",
  emoji: "🍽️",
  headline: "Hungry for more?",
  description:
    "You've run {count} dish searches against your own nutrient limits. Dishcovery was built by Ethan Poh in AI Lodge. Curious how it works, or want to build something like it?",
  programme: "AI Lodge",
  programmeLink: "https://www.smubia.com/ai-lodge",
  githubLink: "https://github.com/smubia-projects/ail-ay2627-s1-ethan-dishcovery",
  showcaseLink: "https://www.smubia.com/showcase",
} as const;

const LINKS = [
  { label: `Join ${CTA_PROJECT.programme}`, href: CTA_PROJECT.programmeLink, primary: true },
  { label: "Self-host from GitHub", href: CTA_PROJECT.githubLink, primary: false },
  { label: "Explore other projects", href: CTA_PROJECT.showcaseLink, primary: false },
];

interface Props {
  /** Successful searches so far; null keeps the CTA closed. */
  count: number | null;
  onDismiss: () => void;
}

/**
 * Engagement CTA, shown once after a few successful searches. Never blocks: "Maybe later", Escape and
 * a backdrop click all close it and the app keeps working. Base UI's modal dialog supplies role="dialog",
 * aria-modal and the focus trap; colours come from the app's own theme tokens.
 */
export function EngagementCta({ count, onDismiss }: Props) {
  const description = CTA_PROJECT.description.replace("{count}", String(count ?? 0));
  return (
    <Dialog open={count !== null} onOpenChange={(open) => !open && onDismiss()}>
      <DialogPortal>
        <DialogOverlay className="z-[1000] bg-black/30 duration-500 supports-backdrop-filter:backdrop-blur-md" />
        <DialogPrimitive.Popup
          aria-modal="true"
          className="fixed top-1/2 left-1/2 z-[1001] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 px-6 pt-7 pb-6 text-primary-foreground">
            <div aria-hidden="true" className="absolute -top-8 -right-8 size-32 rounded-full bg-primary-foreground/10" />
            <div aria-hidden="true" className="absolute top-10 right-12 size-14 rounded-full bg-primary-foreground/10" />
            <p className="relative text-xs font-semibold tracking-widest uppercase opacity-80">
              {CTA_PROJECT.name} · {CTA_PROJECT.programme}
            </p>
            <DialogPrimitive.Title className="relative mt-2 flex items-center gap-2 text-2xl font-semibold">
              {CTA_PROJECT.headline}
              <span aria-hidden="true">{CTA_PROJECT.emoji}</span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="relative mt-2 text-sm leading-relaxed opacity-90">
              {description}
            </DialogPrimitive.Description>
          </div>

          <div className="flex flex-col gap-2.5 px-6 pt-5 pb-4">
            {LINKS.map(({ label, href, primary }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: primary ? "default" : "outline", size: "lg" }),
                  "relative h-11 w-full justify-center",
                  primary && "bg-gradient-to-br from-primary to-primary/80",
                )}
              >
                {label}
                <span aria-hidden="true" className="absolute right-[18px] opacity-70">→</span>
              </a>
            ))}
            <DialogPrimitive.Close className={cn(buttonVariants({ variant: "link", size: "sm" }), "mt-1 self-center text-muted-foreground")}>
              Maybe later
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
