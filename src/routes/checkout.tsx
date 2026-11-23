import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { business, locations } from "@/data/menu";
import { formatNaira } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { createCheckout } from "@/lib/orders.functions";
import { saveTicketAccess } from "@/lib/ticket-access";
import { loadPaystack, openPaystack } from "@/lib/paystack-inline";
import {
  CAMPAIGN_DELIVERY_FEE,
  DELIVERY_WINDOW_LABEL,
  PICKUP_WINDOW_LABEL,
  deliveryFeeFor,
  isPreOrderOffer,
  isValidSlot,
  slotDays,
  timeBounds,
} from "@/lib/campaign";
// import { LocationPin } from "@/components/LocationPin";
import { nearestZone, type DeliveryZone, type Pin } from "@/lib/zones";

const title = "Checkout | McRelish";
const description =
  "Complete your McRelish order — choose pickup or delivery and pay securely online.";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

type Zone = DeliveryZone;

function CheckoutPage() {
  const { items, subtotal, hydrated, storageError } = useStore();
  const { user, profile, ready } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const filledFor = useRef<string | null>(null);
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [manualArea, setManualArea] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pin] = useState<Pin | null>(null);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const preferredAt = day && time ? `${day}T${time}:00+01:00` : "";
  const navigate = useNavigate();

  useEffect(() => {
    loadPaystack().catch(() => undefined);
  }, []);

  useEffect(() => {
    api<{ zones: Zone[] }>("/api/delivery-zones")
      .then((data) => setZones(data.zones))
      .catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!profile || !user || !hydrated || !items.length || filledFor.current === user.id) return;
    const form = formRef.current;
    if (!form) return;
    for (const [name, value] of [
      ["fullname", profile.full_name],
      ["phone", profile.phone],
      ["email", user.email ?? ""],
    ]) {
      const input = form.elements.namedItem(name ?? "");
      if (input instanceof HTMLInputElement && !input.value) input.value = value ?? "";
    }
    filledFor.current = user.id;
  }, [profile, user, hydrated, items.length]);

  if (!hydrated)
    return (
      <section className="section-pad px-4 text-center" role="status">
        Loading your cart…
      </section>
    );

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Add a meal from the menu to start your order.
        </p>
        <Link to="/menu" className="btn-primary mt-8">
          View Menu
        </Link>
      </section>
    );
  }

  const matched = pin ? nearestZone(zones, pin) : null;
  const autoArea = Boolean(matched) && !manualArea;
  const zone = autoArea ? matched : zones.find((z) => z.id === zoneId);
  const deliveryFee = method === "delivery" ? (zone ? deliveryFeeFor(zone.fee) : null) : 0;
  const offer = isPreOrderOffer();
  const days = slotDays(method);
  const bounds = day ? timeBounds(method, day) : null;
  const total = deliveryFee === null ? null : subtotal + deliveryFee;
  const deliveryUnavailable = method === "delivery" && zones.length === 0;

  return (
    <section className="section-pad">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold sm:text-5xl">Checkout</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Share your details and pay securely. You'll get a downloadable ticket as soon as payment
          goes through.
        </p>
        {ready && !user && (
          <p className="mt-4 text-sm">
            <Button asChild variant="link" className="h-auto px-0">
              <Link to="/auth" search={{ next: "checkout" }}>
                Sign in for saved customer details
              </Link>
            </Button>
            <span className="text-muted-foreground"> · or continue as a guest below.</span>
          </p>
        )}
        {user && (
          <p className="mt-4 text-sm text-muted-foreground">
            Ordering as {profile?.full_name || user.email}. You can change your details for this
            order.
          </p>
        )}
        {storageError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Your browser is blocking cart storage. Keep this tab open so you do not lose your items.
          </p>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <form
            ref={formRef}
            className="card-surface grid gap-4 p-6 sm:grid-cols-2 lg:p-8"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy || !items.length || deliveryUnavailable) return;
              setBusy(true);
              setError("");
              const data = new FormData(e.currentTarget);
              const text = (key: string) => String(data.get(key) ?? "").trim();
              if (!isValidSlot(method, preferredAt)) {
                setError(
                  method === "delivery"
                    ? "Delivery is available between 12:00 PM and 8:00 PM. Please choose a time in that window."
                    : "Pickup is available between 12:00 PM and 8:00 PM. Please choose a time in that window.",
                );
                setBusy(false);
                return;
              }
              try {
                const res = await createCheckout({
                  data: {
                    items: items.map((i) => ({
                      productId: i.productId,
                      quantity: i.quantity,
                      options: i.options,
                      extras: i.extras ?? {},
                      ...(i.notes ? { notes: i.notes } : {}),
                    })),
                    method,
                    customer: {
                      name: text("fullname"),
                      phone: text("phone"),
                      email: text("email"),
                    },
                    preferredAt,
                    address: method === "delivery" ? text("address") : "",
                    hub: method === "pickup" ? text("hub") : "",
                    zoneId: method === "delivery" ? (zone?.id ?? null) : null,
                    pin: method === "delivery" ? pin : null,
                    notes: text("order-notes"),
                    origin: window.location.origin,
                  },
                });
                saveTicketAccess(res.reference, res.token);
                if (!res.access_code) {
                  window.location.assign(res.link);
                  return;
                }
                try {
                  await openPaystack({
                    accessCode: res.access_code,
                    onPaid: (reference) =>
                      void navigate({
                        to: "/payment/callback",
                        search: {
                          ref: res.reference,
                          status: "successful",
                          transaction_id: reference,
                        },
                      }),
                    onDismiss: () => {
                      setError(
                        "Payment was not completed. Your cart is still here; you can try again.",
                      );
                      setBusy(false);
                    },
                  });
                } catch {
                  window.location.assign(res.link);
                }
              } catch (err) {
                setError(
                  err instanceof Error && err.message.length < 200
                    ? err.message
                    : "Payment could not start. Your cart is still here; please try again.",
                );
                setBusy(false);
              }
            }}
          >
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold">How would you like it?</legend>
              <div className="mt-2 flex gap-2">
                {(["pickup", "delivery"] as const).map((m) => (
                  <label
                    key={m}
                    className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm capitalize transition-colors ${method === m ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => {
                        setMethod(m);
                        setDay("");
                        setTime("");
                      }}
                      className="sr-only"
                    />
                    {m}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field id="fullname" label="Full name" required />
            <Field id="phone" label="Phone number" type="tel" required />
            <Field id="email" label="Email (for your receipt)" type="email" required />
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium">
                {method === "delivery" ? "Delivery day & time" : "Pickup day & time"}
              </legend>
              <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                <select
                  id="day"
                  name="day"
                  required
                  aria-label="Day"
                  value={day}
                  onChange={(e) => {
                    setDay(e.target.value);
                    setTime("");
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
                >
                  <option value="" disabled>
                    Select day
                  </option>
                  {days.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <input
                  id="time"
                  name="time"
                  type="time"
                  required
                  aria-label="Time"
                  disabled={!day}
                  value={time}
                  min={bounds?.min}
                  max={bounds?.max}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm disabled:opacity-60"
                />
              </div>
            </fieldset>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              All times are Lagos time.{" "}
              {method === "delivery" ? DELIVERY_WINDOW_LABEL : PICKUP_WINDOW_LABEL} Need a custom
              time or a special order? Call {business.phone} or message us on WhatsApp.
            </p>

            {method === "pickup" && (
              <div className="sm:col-span-2">
                <label htmlFor="hub" className="text-sm font-medium">
                  Pickup food hub
                </label>
                <select
                  id="hub"
                  name="hub"
                  required
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-3 text-sm"
                >
                  {locations
                    .filter((hub) => hub.open)
                    .map((hub) => (
                      <option key={hub.id} value={hub.name}>
                        {hub.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {method === "delivery" &&
              (deliveryUnavailable ? (
                <p className="rounded-xl bg-muted p-4 text-sm sm:col-span-2">
                  Online delivery isn't open yet. Please choose pickup, or call {business.phone}.
                </p>
              ) : (
                <>
                  {/* Location pin hidden for now; restore LocationPin block.
                  <div className="sm:col-span-2">
                    <LocationPin
                      pin={pin}
                      onChange={(p) => {
                        setPin(p);
                        setManualArea(false);
                      }}
                    />
                  </div>
                  */}
                  <div className="sm:col-span-2">
                    {autoArea && matched ? (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-sm">
                        <p className="font-medium">Delivering to {matched.name}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          Matched from your pin · {formatNaira(deliveryFeeFor(matched.fee))}
                          {offer && matched.fee !== CAMPAIGN_DELIVERY_FEE
                            ? ` (usually ${formatNaira(matched.fee)})`
                            : ""}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setManualArea(true);
                            setZoneId(matched.id);
                          }}
                          className="mt-1.5 text-xs font-semibold text-primary underline"
                        >
                          Not right? Choose your area
                        </button>
                      </div>
                    ) : (
                      <>
                        <label htmlFor="zone" className="text-sm font-medium">
                          Delivery area
                        </label>
                        <select
                          id="zone"
                          required
                          value={zoneId}
                          onChange={(e) => setZoneId(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border bg-background px-3 py-3 text-sm"
                        >
                          <option value="" disabled>
                            Choose your area
                          </option>
                          {zones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} — {formatNaira(deliveryFeeFor(z.fee))}
                              {offer && z.fee !== CAMPAIGN_DELIVERY_FEE
                                ? ` (usually ${formatNaira(z.fee)})`
                                : ""}
                            </option>
                          ))}
                        </select>
                        {pin && !matched && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            We couldn't match your pin to an area. Please choose your area.
                          </p>
                        )}
                        {pin && matched && manualArea && (
                          <button
                            type="button"
                            onClick={() => setManualArea(false)}
                            className="mt-1.5 text-xs font-semibold text-primary underline"
                          >
                            Use the area matched from my pin ({matched.name})
                          </button>
                        )}
                      </>
                    )}
                    {offer && (
                      <p className="mt-1.5 text-xs font-medium text-primary">
                        Pre-order offer: flat {formatNaira(CAMPAIGN_DELIVERY_FEE)} delivery anywhere
                        in Awka.
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="text-sm font-medium">
                      Delivery address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      required
                      minLength={5}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                      placeholder="Lodge or compound name, room/flat number, nearby landmark"
                    />
                  </div>
                </>
              ))}

            <div className="sm:col-span-2">
              <label htmlFor="order-notes" className="text-sm font-medium">
                Notes for the kitchen (optional)
              </label>
              <textarea
                id="order-notes"
                name="order-notes"
                rows={3}
                maxLength={500}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || deliveryUnavailable}
              className="min-h-12 sm:col-span-2"
            >
              <Lock />
              {busy
                ? "Opening secure payment…"
                : total === null
                  ? "Choose a delivery area"
                  : `Pay ${formatNaira(total)}`}
            </Button>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Payments are processed securely by Paystack (card, bank transfer, USSD).
            </p>
          </form>

          <aside className="card-surface p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl font-bold">Order summary</h2>
            <ul className="mt-4 divide-y">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-3">
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.quantity} × {item.name}
                    </p>
                    {(item.details?.length ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">{item.details!.join(", ")}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">{formatNaira(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd className="text-right">
                  {deliveryFee === null
                    ? "Choose area"
                    : method === "pickup"
                      ? "₦0 (pickup)"
                      : formatNaira(deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold">{total === null ? "—" : formatNaira(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
      />
    </div>
  );
}
