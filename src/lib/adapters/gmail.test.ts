import { describe, it, expect } from "vitest";
import { encodeMimeSubject } from "./gmail";

describe("encodeMimeSubject (RFC 2047)", () => {
  it("passes plain ASCII through unchanged", () => {
    expect(encodeMimeSubject("Quarterly recap - action items")).toBe(
      "Quarterly recap - action items"
    );
  });

  it("encodes non-ASCII as a UTF-8 B encoded-word", () => {
    const encoded = encodeMimeSubject("Résumé für März");
    expect(encoded).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/]+=*\?=$/);
    const b64 = encoded.slice("=?UTF-8?B?".length, -"?=".length);
    expect(Buffer.from(b64, "base64").toString("utf8")).toBe("Résumé für März");
  });

  it("encodes emoji subjects", () => {
    const encoded = encodeMimeSubject("Launch 🚀 tomorrow");
    expect(encoded.startsWith("=?UTF-8?B?")).toBe(true);
    const b64 = encoded.slice("=?UTF-8?B?".length, -"?=".length);
    expect(Buffer.from(b64, "base64").toString("utf8")).toBe("Launch 🚀 tomorrow");
  });

  it("treats control characters as non-ASCII (encodes)", () => {
    expect(encodeMimeSubject("line\nbreak").startsWith("=?UTF-8?B?")).toBe(true);
  });
});
