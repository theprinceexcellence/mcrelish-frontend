export type Pin = { lat: number; lng: number };
export type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  lat?: number | null;
  lng?: number | null;
};

/** Furthest a pin may be from an area's map position and still be matched to it. */
export const MAX_ZONE_KM = 15;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: Pin, b: Pin) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** The closest area that has a map position, or null when none is within range. */
export function nearestZone(
  zones: DeliveryZone[],
  pin: Pin,
  maxKm = MAX_ZONE_KM,
): DeliveryZone | null {
  let best: DeliveryZone | null = null;
  let bestKm = Infinity;
  for (const zone of zones) {
    if (zone.lat == null || zone.lng == null) continue;
    const km = distanceKm(pin, { lat: zone.lat, lng: zone.lng });
    if (km < bestKm) {
      best = zone;
      bestKm = km;
    }
  }
  return best && bestKm <= maxKm ? best : null;
}
