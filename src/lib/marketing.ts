// Marketing consent: wording, version and supported channels.
// Bump CONSENT_VERSION whenever MARKETING_CONSENT_TEXT changes; each consent event stores the version shown.
export const CONSENT_VERSION = "2026-10-28.v1";
export const MARKETING_CONSENT_TEXT =
  "Yes, I would like to receive updates from McRelish about new meals, special offers, discounts, food boxes, catering services, and other promotions through the communication channels I select. I understand that I can withdraw my consent at any time.";

// Only channels McRelish can actually use. SMS is not offered (no SMS sender in place).
export const MARKETING_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number]["id"];

/** Normalises a requested channel list: no consent → no channels; unknown channels dropped. */
export function consentChannels(optedIn: boolean, channels: readonly string[]): MarketingChannel[] {
  if (!optedIn) return [];
  const allowed = new Set<string>(MARKETING_CHANNELS.map((c) => c.id));
  return [...new Set(channels)].filter((c): c is MarketingChannel => allowed.has(c)).sort();
}

/** Promotion gate mirrored from the database: true only with current opt-in on that exact channel. */
export function canReceivePromotion(pref: { opted_in: boolean; channels: readonly string[] } | null | undefined, channel: MarketingChannel): boolean {
  return !!pref && pref.opted_in && pref.channels.includes(channel);
}
