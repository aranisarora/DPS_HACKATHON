import { describe, expect, it } from "vitest";
import { parseCalendarParams } from "./schemas";

describe("parseCalendarParams", () => {
  const valid = {
    summary: "Kickoff with ACME",
    start: "2026-07-19T15:00:00+05:30",
    end: "2026-07-19T16:00:00+05:30",
  };

  it("accepts concrete ISO start/end", () => {
    expect(parseCalendarParams(valid).success).toBe(true);
  });

  it("falls back to the action title when summary is missing", () => {
    const { summary: _omit, ...rest } = valid;
    const res = parseCalendarParams(rest, "Book kickoff");
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.summary).toBe("Book kickoff");
  });

  it("rejects when start/end are missing entirely", () => {
    expect(parseCalendarParams({ summary: "Meet" }).success).toBe(false);
  });

  it("rejects natural-language dates the Google API would 400 on", () => {
    expect(
      parseCalendarParams({ ...valid, start: "tomorrow", end: "tomorrow" }).success
    ).toBe(false);
  });

  it("rejects end before start", () => {
    expect(
      parseCalendarParams({ ...valid, start: valid.end, end: valid.start }).success
    ).toBe(false);
  });

  it("rejects invented attendee strings that are not emails", () => {
    expect(
      parseCalendarParams({ ...valid, attendees: ["John from accounting"] }).success
    ).toBe(false);
  });

  it("accepts bare local datetimes (executor attaches the timezone)", () => {
    expect(
      parseCalendarParams({
        ...valid,
        start: "2026-07-19T15:00:00",
        end: "2026-07-19T16:00:00",
      }).success
    ).toBe(true);
  });
});
