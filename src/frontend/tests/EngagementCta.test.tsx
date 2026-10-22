import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EngagementCta } from "@/components/EngagementCta";
import { recordSuccessfulMatch } from "@/services/engagement";

describe("recordSuccessfulMatch", () => {
  beforeEach(() => localStorage.clear());

  it("asks for the CTA once, on the third successful search", () => {
    expect(recordSuccessfulMatch()).toBeNull();
    expect(recordSuccessfulMatch()).toBeNull();
    expect(recordSuccessfulMatch()).toBe(3);
    expect(recordSuccessfulMatch()).toBeNull();
    expect(localStorage.getItem("ail-ay2627-s1-ethan-dishcovery:matches")).toBe("4");
  });

  it("stays quiet when storage throws", () => {
    const broken = { getItem: () => { throw new Error("blocked"); } } as unknown as Storage;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(recordSuccessfulMatch(broken)).toBeNull();
  });
});

describe("EngagementCta", () => {
  it("renders nothing while closed", () => {
    render(<EngagementCta count={null} onDismiss={() => undefined} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is an accessible, dismissible modal with the three AI Lodge links", async () => {
    const onDismiss = vi.fn();
    render(<EngagementCta count={3} onDismiss={onDismiss} />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("You've run 3 dish searches");
    expect(screen.getByRole("link", { name: /Join AI Lodge/ })).toHaveAttribute("href", "https://www.smubia.com/ailodge");
    expect(screen.getByRole("link", { name: /View on GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/smubia-projects/ail-ay2627-s1-ethan-dishcovery",
    );
    expect(screen.getByRole("link", { name: /Explore other projects/ })).toHaveAttribute("target", "_blank");
    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    await waitFor(() => expect(onDismiss).toHaveBeenCalled());
  });
});
