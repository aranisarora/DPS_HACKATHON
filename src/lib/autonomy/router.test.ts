import { describe, it, expect } from "vitest";
import { routeAction, mayFire, urgencyScore } from "./router";

describe("routeAction — the deterministic gate", () => {
  it("auto-executes internal reversible high-confidence actions", () => {
    expect(
      routeAction({
        action_type: "calendar_block",
        confidence: 0.92,
        blast_radius: "internal",
        reversible: true,
        feasible: true,
      })
    ).toBe("auto");
  });

  it("NEVER auto-sends external email, even at confidence 1.0", () => {
    expect(
      routeAction({
        action_type: "recap_email",
        confidence: 1.0,
        blast_radius: "external",
        reversible: false,
        feasible: true,
      })
    ).toBe("approve");
  });

  it("never auto-fires outbound comms even if mislabelled internal", () => {
    // Defence in depth: model claims internal+reversible, deny-list still catches it
    expect(
      routeAction({
        action_type: "email_reply",
        confidence: 0.99,
        blast_radius: "internal",
        reversible: true,
        feasible: true,
      })
    ).toBe("approve");
  });

  it("suggests when there is no integration (infeasible)", () => {
    expect(
      routeAction({
        action_type: "other",
        confidence: 0.95,
        blast_radius: "internal",
        reversible: true,
        feasible: false,
      })
    ).toBe("suggest");
  });

  it("suggests on low confidence regardless of type", () => {
    expect(
      routeAction({
        action_type: "calendar_block",
        confidence: 0.3,
        blast_radius: "internal",
        reversible: true,
        feasible: true,
      })
    ).toBe("suggest");
  });

  it("requires approval for irreversible actions", () => {
    expect(
      routeAction({
        action_type: "agenda_add",
        confidence: 0.95,
        blast_radius: "internal",
        reversible: false,
        feasible: true,
      })
    ).toBe("approve");
  });

  it("medium confidence internal actions go to approve, not auto", () => {
    expect(
      routeAction({
        action_type: "calendar_block",
        confidence: 0.7,
        blast_radius: "internal",
        reversible: true,
        feasible: true,
      })
    ).toBe("approve");
  });

  it("team blast radius blocks auto even for eligible types", () => {
    expect(
      routeAction({
        action_type: "task_assignment",
        confidence: 0.95,
        blast_radius: "team",
        reversible: true,
        feasible: true,
      })
    ).toBe("approve");
  });

  it("respects owner-tuned thresholds", () => {
    expect(
      routeAction({
        action_type: "calendar_block",
        confidence: 0.8,
        blast_radius: "internal",
        reversible: true,
        feasible: true,
        thresholds: { auto_confidence_min: 0.75 },
      })
    ).toBe("auto");
  });
});

describe("mayFire — final pre-adapter gate", () => {
  it("suggestions never fire", () => {
    expect(mayFire({ tier: "suggest", status: "approved", approvedByOwner: true })).toBe(false);
  });

  it("approve tier requires explicit owner approval", () => {
    expect(mayFire({ tier: "approve", status: "approved", approvedByOwner: false })).toBe(false);
    expect(mayFire({ tier: "approve", status: "approved", approvedByOwner: true })).toBe(true);
    expect(mayFire({ tier: "approve", status: "edited", approvedByOwner: true })).toBe(true);
  });

  it("approve tier does not fire from proposed status", () => {
    expect(mayFire({ tier: "approve", status: "proposed", approvedByOwner: true })).toBe(false);
  });

  it("auto tier fires from proposed", () => {
    expect(mayFire({ tier: "auto", status: "proposed", approvedByOwner: false })).toBe(true);
  });
});

describe("urgencyScore — ordering only, never autonomy", () => {
  it("scores near-term due dates higher", () => {
    const soon = urgencyScore({
      importance: 0.8,
      due_hint: new Date(Date.now() + 3600_000).toISOString(),
    });
    const later = urgencyScore({
      importance: 0.8,
      due_hint: new Date(Date.now() + 14 * 86400_000).toISOString(),
    });
    expect(soon).toBeGreaterThan(later);
  });
});
