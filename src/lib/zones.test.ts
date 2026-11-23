import { describe, expect, it } from "vitest";
import { distanceKm, nearestZone, type DeliveryZone } from "./zones";

const zones: DeliveryZone[] = [
  { id: "a", name: "Near", fee: 2000, lat: 6.21, lng: 7.07 },
  { id: "b", name: "Far", fee: 4000, lat: 6.1, lng: 7.04 },
  { id: "c", name: "No position", fee: 2500 },
];

describe("nearestZone", () => {
  it("picks the closest area that has a map position", () => {
    expect(nearestZone(zones, { lat: 6.212, lng: 7.072 })?.name).toBe("Near");
    expect(nearestZone(zones, { lat: 6.105, lng: 7.041 })?.name).toBe("Far");
  });
  it("ignores areas without a map position", () => {
    expect(
      nearestZone([{ id: "c", name: "No position", fee: 2500 }], { lat: 6.2, lng: 7.07 }),
    ).toBeNull();
  });
  it("returns nothing when the pin is too far from every area", () => {
    expect(nearestZone(zones, { lat: 6.9, lng: 7.4 })).toBeNull();
  });
  it("measures distance in kilometres", () => {
    expect(distanceKm({ lat: 6.2, lng: 7.0 }, { lat: 6.3, lng: 7.0 })).toBeCloseTo(11.1, 0);
  });
});
