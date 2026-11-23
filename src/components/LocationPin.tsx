import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsLink } from "@/lib/campaign";
import type { Pin } from "@/lib/zones";

/** Captures the customer's exact GPS position so riders can navigate straight to it. */
export function LocationPin({
  pin,
  onChange,
}: {
  pin: Pin | null;
  onChange: (p: Pin | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function locate() {
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share location. Please describe a landmark instead.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(false);
        const p = {
          lat: Number(coords.latitude.toFixed(6)),
          lng: Number(coords.longitude.toFixed(6)),
        };
        if (p.lat < 5.5 || p.lat > 7 || p.lng < 6.5 || p.lng > 7.5) {
          setError(
            "That location looks outside our Awka delivery area. Please check your address.",
          );
          return;
        }
        onChange(p);
      },
      () => {
        setBusy(false);
        setError(
          "We couldn't get your location. Allow location access, or describe a landmark in your address.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-3">
      <p className="text-sm font-medium">
        Pin your exact location{" "}
        <span className="font-normal text-muted-foreground">(recommended)</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Tap the button and we'll match your delivery area from it, so you won't need to pick one.
        Our rider also gets your exact spot.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={pin ? "outline" : "default"}
          size="sm"
          onClick={locate}
          disabled={busy}
        >
          <MapPin />
          {busy ? "Finding you…" : pin ? "Update pin" : "Use my current location"}
        </Button>
        {pin && (
          <>
            <a
              href={mapsLink(pin.lat, pin.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary underline"
            >
              Check pin on map
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-muted-foreground underline"
            >
              Remove
            </button>
          </>
        )}
      </div>
      {pin && <p className="mt-2 text-xs text-muted-foreground">Location pinned ✓</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
