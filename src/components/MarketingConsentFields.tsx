import { MARKETING_CHANNELS, MARKETING_CONSENT_TEXT, type MarketingChannel } from "@/lib/marketing";

export function MarketingConsentFields({ optedIn, channels, onChange }: { optedIn: boolean; channels: MarketingChannel[]; onChange: (optedIn: boolean, channels: MarketingChannel[]) => void }) {
  return <fieldset className="rounded-xl border bg-muted/30 p-4">
    <legend className="px-1 text-sm font-semibold">Promotions (optional)</legend>
    <label className="flex items-start gap-3 text-sm leading-relaxed">
      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" checked={optedIn}
        onChange={(e) => onChange(e.target.checked, e.target.checked ? channels : [])} />
      <span>{MARKETING_CONSENT_TEXT}</span>
    </label>
    {optedIn && <div className="mt-3 pl-8">
      <p className="text-xs font-medium text-muted-foreground">Send promotions by:</p>
      <div className="mt-2 flex flex-wrap gap-4">
        {MARKETING_CHANNELS.map((c) => <label key={c.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5" checked={channels.includes(c.id)}
            onChange={(e) => onChange(true, e.target.checked ? [...channels, c.id] : channels.filter((x) => x !== c.id))} />
          {c.label}
        </label>)}
      </div>
      {channels.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Pick at least one channel, or untick the box above.</p>}
    </div>}
    <p className="mt-3 text-xs text-muted-foreground">Order confirmations and delivery updates are sent regardless of this choice.</p>
  </fieldset>;
}
