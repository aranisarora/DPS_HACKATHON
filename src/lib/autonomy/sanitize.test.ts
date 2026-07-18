import { describe, it, expect } from "vitest";
import { sanitizeCalendarParams } from "./sanitize";

describe("sanitizeCalendarParams", () => {
  const base = {
    summary: "Kickoff",
    start: "2026-07-20T10:00:00Z",
    end: "2026-07-20T11:00:00Z",
  };

  it("strips attendees when the owner has NOT approved", () => {
    const params = { ...base, attendees: ["client@external.com", "boss@corp.com"] };
    const { params: safe, stripped_attendees } = sanitizeCalendarParams(params, false);
    expect(safe).not.toHaveProperty("attendees");
    expect(stripped_attendees).toEqual(["client@external.com", "boss@corp.com"]);
    // Everything else untouched
    expect(safe.summary).toBe("Kickoff");
    expect(safe.start).toBe(base.start);
  });

  it("preserves attendees when the owner approved", () => {
    const params = { ...base, attendees: ["client@external.com"] };
    const { params: safe, stripped_attendees } = sanitizeCalendarParams(params, true);
    expect(safe.attendees).toEqual(["client@external.com"]);
    expect(stripped_attendees).toBeNull();
  });

  it("is a no-op when attendees are absent", () => {
    const { params: safe, stripped_attendees } = sanitizeCalendarParams({ ...base }, false);
    expect(safe).toEqual(base);
    expect(stripped_attendees).toBeNull();
  });

  it("is a no-op when attendees is an empty array", () => {
    const params = { ...base, attendees: [] as string[] };
    const { params: safe, stripped_attendees } = sanitizeCalendarParams(params, false);
    expect(safe.attendees).toEqual([]);
    expect(stripped_attendees).toBeNull();
  });

  it("does not mutate the input object", () => {
    const params = { ...base, attendees: ["a@b.com"] };
    sanitizeCalendarParams(params, false);
    expect(params.attendees).toEqual(["a@b.com"]);
  });
});
