export const DELIVERY_START = "2026-11-09";
export const DELIVERY_FIRST_DAY = "2026-11-16";
export const LAST_DAY = "2026-11-30";
export const DELIVERY_OPEN_MINUTES = 12 * 60;
export const DELIVERY_CLOSE_MINUTES = 20 * 60;
export const PICKUP_OPEN_MINUTES = 12 * 60;
export const PICKUP_CLOSE_MINUTES = 20 * 60;

export const CAMPAIGN_DELIVERY_FEE = 1500;
export const LIVE_ORDER_START_MS = Date.parse("2026-11-16T00:00:00+01:00");

export const DELIVERY_WINDOW_LABEL =
  "Delivery runs 12:00 PM – 8:00 PM, Monday to Saturday, 16 – 30 November.";
export const PICKUP_WINDOW_LABEL =
  "Pickup from our food hub is 12:00 PM – 8:00 PM, Monday to Saturday.";

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type Slot = { value: string; label: string };
export type SlotMethod = "pickup" | "delivery";

function lagosClock(ms: number) {
  const local = new Date(ms + LAGOS_OFFSET_MS);
  return {
    day: local.toISOString().slice(0, 10),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

function lagosParts(preferredAt: string | null | undefined) {
  if (!preferredAt) return null;
  const t = new Date(preferredAt);
  return Number.isNaN(t.getTime()) ? null : lagosClock(t.getTime());
}

/** Pre-orders (placed before Monday 16 Nov, Lagos) get the flat delivery fee. */
export function isPreOrderOffer(nowMs: number = Date.now()) {
  return nowMs < LIVE_ORDER_START_MS;
}

export function deliveryFeeFor(zoneFee: number, nowMs: number = Date.now()) {
  return isPreOrderOffer(nowMs) ? CAMPAIGN_DELIVERY_FEE : zoneFee;
}

const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();
const addDays = (day: string, n: number) =>
  new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

function slotWindow(method: SlotMethod) {
  return method === "delivery"
    ? { open: DELIVERY_OPEN_MINUTES, close: DELIVERY_CLOSE_MINUTES }
    : { open: PICKUP_OPEN_MINUTES, close: PICKUP_CLOSE_MINUTES };
}

const clockText = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Earliest and latest time (HH:MM) allowed on a day; null when none is left. */
export function timeBounds(method: SlotMethod, day: string, nowMs: number = Date.now()) {
  const { open, close } = slotWindow(method);
  const now = lagosClock(nowMs);
  const from = day === now.day ? Math.max(open, now.minutes + 1) : open;
  return from > close ? null : { min: clockText(from), max: clockText(close) };
}

/** Selectable days: Mon-Sat until 30 Nov; delivery starts 16 Nov. */
export function slotDays(method: SlotMethod, nowMs: number = Date.now()): Slot[] {
  const today = lagosClock(nowMs).day;
  const tomorrow = addDays(today, 1);
  const first = method === "delivery" && today < DELIVERY_FIRST_DAY ? DELIVERY_FIRST_DAY : today;
  const out: Slot[] = [];
  for (let day = first; day <= LAST_DAY; day = addDays(day, 1)) {
    if (weekday(day) === 0) continue;
    if (!timeBounds(method, day, nowMs)) continue;
    const date = new Date(`${day}T12:00:00Z`);
    const short = `${SHORT_DAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
    const prefix = day === today ? "Today (" : day === tomorrow ? "Tomorrow (" : "";
    out.push({ value: day, label: prefix ? `${prefix}${short})` : short });
  }
  return out;
}

/** True when a scheduled time sits inside the window for that method. */
export function isValidSlot(method: SlotMethod, preferredAt: string) {
  const parts = lagosParts(preferredAt);
  const { open, close } = slotWindow(method);
  return !!parts && parts.minutes >= open && parts.minutes <= close;
}

export const discountPercent = (price: number, original: number) =>
  original > price ? Math.round(((original - price) / original) * 100) : 0;

export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
