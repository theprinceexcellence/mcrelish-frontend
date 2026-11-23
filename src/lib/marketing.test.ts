import { describe, it, expect } from "vitest";
import { consentChannels, canReceivePromotion } from "./marketing";

describe("marketing consent rules", () => {
  it("declining marketing records no channels even if some were ticked", () => {
    expect(consentChannels(false, ["whatsapp", "email"])).toEqual([]);
  });
  it("opting in keeps only the selected supported channels", () => {
    expect(consentChannels(true, ["whatsapp", "sms"])).toEqual(["whatsapp"]);
  });
  it("customer with no record is excluded from promotions", () => {
    expect(canReceivePromotion(null, "whatsapp")).toBe(false);
  });
  it("WhatsApp-only customer is excluded from email promotions", () => {
    expect(canReceivePromotion({ opted_in: true, channels: ["whatsapp"] }, "email")).toBe(false);
    expect(canReceivePromotion({ opted_in: true, channels: ["whatsapp"] }, "whatsapp")).toBe(true);
  });
  it("withdrawn customer is excluded", () => {
    expect(canReceivePromotion({ opted_in: false, channels: [] }, "whatsapp")).toBe(false);
  });
});
