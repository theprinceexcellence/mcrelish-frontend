import { describe, expect, it } from "vitest";
import {
  deliveryFeeFor,
  discountPercent,
  isPreOrderOffer,
  isValidSlot,
  slotDays,
  timeBounds,
} from "./campaign";

const at = (iso: string) => Date.parse(iso);

describe("pre-order delivery offer", () => {
  it("charges a flat ₦1,500 for orders placed before Monday 16 November", () => {
    expect(deliveryFeeFor(4000, at("2026-11-12T10:00:00+01:00"))).toBe(1500);
    expect(deliveryFeeFor(4000, at("2026-11-15T23:59:59+01:00"))).toBe(1500);
    expect(isPreOrderOffer(at("2026-11-15T23:59:59+01:00"))).toBe(true);
  });
  it("charges the usual area price from Monday 16 November", () => {
    expect(deliveryFeeFor(4000, at("2026-11-16T00:00:00+01:00"))).toBe(4000);
    expect(deliveryFeeFor(2000, at("2026-11-20T15:00:00+01:00"))).toBe(2000);
  });
  it("shows Jolly Fest as 19% off ₦6,800", () => {
    expect(discountPercent(5500, 6800)).toBe(19);
  });
});

describe("delivery and pickup days", () => {
  const thu12 = at("2026-11-12T10:00:00+01:00");

  it("offers delivery from 16 to 30 November, Monday to Saturday", () => {
    const days = slotDays("delivery", thu12);
    expect(days[0]?.value).toBe("2026-11-16");
    expect(days.at(-1)?.value).toBe("2026-11-30");
    expect(days).toHaveLength(13);
    expect(days.some((d) => d.value === "2026-11-22" || d.value === "2026-11-29")).toBe(false);
  });
  it("offers pickup Monday to Saturday, today to 30 November", () => {
    const days = slotDays("pickup", thu12);
    expect(days[0]).toEqual({ value: "2026-11-12", label: "Today (Thu, 12 Nov)" });
    expect(days[1]?.label).toBe("Tomorrow (Fri, 13 Nov)");
    expect(days.some((d) => d.value === "2026-11-15")).toBe(false);
    expect(days.at(-1)?.value).toBe("2026-11-30");
  });
  it("drops today once its window has closed", () => {
    expect(slotDays("pickup", at("2026-11-12T21:30:00+01:00"))[0]?.value).toBe("2026-11-13");
  });
});

describe("time windows", () => {
  const thu12 = at("2026-11-12T10:00:00+01:00");

  it("allows delivery from 12:00 PM to 8:00 PM at any minute", () => {
    expect(timeBounds("delivery", "2026-11-16", thu12)).toEqual({ min: "12:00", max: "20:00" });
    expect(isValidSlot("delivery", "2026-11-16T12:00:00+01:00")).toBe(true);
    expect(isValidSlot("delivery", "2026-11-16T14:17:00+01:00")).toBe(true);
    expect(isValidSlot("delivery", "2026-11-16T20:00:00+01:00")).toBe(true);
    expect(isValidSlot("delivery", "2026-11-16T11:59:00+01:00")).toBe(false);
    expect(isValidSlot("delivery", "2026-11-16T20:01:00+01:00")).toBe(false);
  });
  it("accepts pickup from 12:00 PM to 8:00 PM only", () => {
    expect(isValidSlot("pickup", "2026-11-10T11:59:00+01:00")).toBe(false);
    expect(isValidSlot("pickup", "2026-11-10T12:00:00+01:00")).toBe(true);
    expect(isValidSlot("pickup", "2026-11-10T20:00:00+01:00")).toBe(true);
    expect(isValidSlot("pickup", "2026-11-10T20:01:00+01:00")).toBe(false);
  });
  it("starts today's window after the current minute", () => {
    expect(timeBounds("delivery", "2026-11-16", at("2026-11-16T14:10:00+01:00"))?.min).toBe(
      "14:11",
    );
    expect(timeBounds("delivery", "2026-11-16", at("2026-11-16T20:00:00+01:00"))).toBeNull();
  });
});
