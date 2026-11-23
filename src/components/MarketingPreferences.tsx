import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MarketingConsentFields } from "@/components/MarketingConsentFields";
import { api } from "@/lib/api";
import {
  CONSENT_VERSION,
  MARKETING_CHANNELS,
  consentChannels,
  type MarketingChannel,
} from "@/lib/marketing";

type Pref = {
  opted_in: boolean;
  channels: string[];
  consented_at: string | null;
  withdrawn_at: string | null;
};

const formatTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

export function MarketingPreferences() {
  const [pref, setPref] = useState<Pref | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [channels, setChannels] = useState<MarketingChannel[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apply = useCallback((data: Pref) => {
    setPref(data);
    setOptIn(data.opted_in);
    setChannels(consentChannels(data.opted_in, data.channels));
    setLoaded(true);
  }, []);

  useEffect(() => {
    api<Pref>("/api/auth/marketing")
      .then(apply)
      .catch(() => setError("Your preferences could not be loaded."));
  }, [apply]);

  const save = async (next: MarketingChannel[]) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      apply(
        await api<Pref>("/api/auth/marketing", {
          body: { channels: next, version: CONSENT_VERSION },
        }),
      );
      setMessage(
        next.length
          ? "Your marketing preferences have been saved."
          : "You have been unsubscribed from McRelish promotions.",
      );
    } catch {
      setError("Your preferences could not be saved. Please try again.");
    }
    setBusy(false);
  };

  const current = consentChannels(Boolean(pref?.opted_in), pref?.channels ?? []);

  return (
    <section className="mt-10 border-t pt-8" aria-labelledby="mk-heading">
      <h2 id="mk-heading" className="font-display text-2xl font-bold">
        Marketing preferences
      </h2>
      {!loaded && !error ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      ) : loaded ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {current.length
              ? `You receive promotions by ${current.map((c) => MARKETING_CHANNELS.find((x) => x.id === c)?.label).join(" and ")} (since ${formatTime(pref?.consented_at ?? null)}).`
              : pref?.withdrawn_at
                ? `You are not subscribed. You withdrew consent on ${formatTime(pref.withdrawn_at)}.`
                : "You are not subscribed to promotions."}
          </p>
          <div className="mt-4">
            <MarketingConsentFields
              optedIn={optIn}
              channels={channels}
              onChange={(o, c) => {
                setOptIn(o);
                setChannels(c);
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              disabled={busy || (optIn && channels.length === 0)}
              onClick={() => void save(consentChannels(optIn, channels))}
            >
              {busy ? "Saving…" : "Save preferences"}
            </Button>
            {current.length > 0 && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setOptIn(false);
                  setChannels([]);
                  void save([]);
                }}
              >
                Unsubscribe from all
              </Button>
            )}
          </div>
          {message && (
            <p role="status" className="mt-3 text-sm text-primary">
              {message}
            </p>
          )}
        </>
      ) : null}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
