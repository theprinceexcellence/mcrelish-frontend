import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/page-meta";
import { MarketingConsentFields } from "@/components/MarketingConsentFields";
import { CONSENT_VERSION, consentChannels, type MarketingChannel } from "@/lib/marketing";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (c: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: pageMeta(
      "Customer sign in | McRelish",
      "Sign in or create your McRelish customer account, or continue ordering as a guest.",
    ),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    next:
      search["next"] === "checkout" ? "checkout" : search["next"] === "admin" ? "admin" : "account",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, ready, signIn, signUp, signInWithGoogle } = useAuth();
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mkOptIn, setMkOptIn] = useState(false);
  const [mkChannels, setMkChannels] = useState<MarketingChannel[]>([]);
  const [typed, setTyped] = useState({
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });
  const setField = (key: keyof typeof typed) => (value: string) =>
    setTyped((t) => ({ ...t, [key]: value }));
  const signup = mode === "signup";
  const emailMismatch =
    signup &&
    typed.confirmEmail !== "" &&
    typed.confirmEmail.trim().toLowerCase() !== typed.email.trim().toLowerCase();
  const passwordMismatch =
    signup && typed.confirmPassword !== "" && typed.confirmPassword !== typed.password;
  useEffect(() => {
    if (!ready || !user) return;
    let destination = next;
    try {
      const saved = sessionStorage.getItem("mcrelish-auth-next");
      if (saved === "checkout" || saved === "admin") destination = saved;
      sessionStorage.removeItem("mcrelish-auth-next");
    } catch {
      /* unavailable */
    }
    void navigate({
      to:
        destination === "checkout" ? "/checkout" : destination === "admin" ? "/admin" : "/account",
      replace: true,
    });
  }, [ready, user, next, navigate]);
  const [googleId, setGoogleId] = useState("");
  const googleButton = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api<{ google_client_id: string }>("/api/config")
      .then((c) => setGoogleId(c.google_client_id))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!googleId || mode === "forgot") return;
    let cancelled = false;
    const render = () => {
      const gsi = (window as unknown as { google?: GoogleIdentity }).google?.accounts.id;
      if (cancelled || !gsi || !googleButton.current) return;
      gsi.initialize({
        client_id: googleId,
        callback: async ({ credential }) => {
          setBusy(true);
          setError("");
          try {
            sessionStorage.setItem("mcrelish-auth-next", next);
            await signInWithGoogle(credential);
          } catch {
            setError("Sign-in could not be completed. Please try again.");
          } finally {
            setBusy(false);
          }
        },
      });
      gsi.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };
    if ((window as unknown as { google?: unknown }).google) render();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [googleId, mode, next, signInWithGoogle]);
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <p className="text-sm font-semibold text-primary">McRelish customer account</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          {mode === "signup"
            ? "Create your account"
            : mode === "forgot"
              ? "Reset your password"
              : "Welcome back"}
        </h1>
        {mode !== "forgot" && (
          <div className="mt-6 grid grid-cols-2 border-b">
            <Button
              variant="ghost"
              aria-pressed={mode === "signin"}
              className={mode === "signin" ? "border-b-2 border-primary rounded-none" : ""}
              onClick={() => {
                setMode("signin");
                setError("");
                setMessage("");
                setTyped({ email: "", confirmEmail: "", password: "", confirmPassword: "" });
              }}
            >
              Sign in
            </Button>
            <Button
              variant="ghost"
              aria-pressed={mode === "signup"}
              className={mode === "signup" ? "border-b-2 border-primary rounded-none" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
                setTyped({ email: "", confirmEmail: "", password: "", confirmPassword: "" });
              }}
            >
              Create account
            </Button>
          </div>
        )}
        <form
          key={mode}
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setMessage("");
            if (
              emailMismatch ||
              passwordMismatch ||
              (signup && (!typed.confirmEmail || !typed.confirmPassword))
            ) {
              setError("Check that your email and password match.");
              return;
            }
            setBusy(true);
            const data = new FormData(e.currentTarget);
            const email = String(data.get("email") ?? "").trim();
            const password = String(data.get("password") ?? "");
            try {
              if (mode === "forgot") {
                const result = await api<{ dev_link?: string }>("/api/auth/forgot", {
                  body: { email, origin: window.location.origin },
                });
                if (result.dev_link)
                  console.info("Password reset link (development only):", result.dev_link);
                setMessage(
                  "If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder.",
                );
              } else if (mode === "signup") {
                await signUp(email, password, String(data.get("full_name") ?? "").trim(), {
                  channels: consentChannels(mkOptIn, mkChannels),
                  version: CONSENT_VERSION,
                });
              } else {
                await signIn(email, password);
              }
            } catch {
              setError(
                mode === "signin"
                  ? "Unable to sign in. Check your email and password."
                  : "Unable to complete your request. Please try again shortly.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "signup" && (
            <AuthInput name="full_name" label="Full name" autoComplete="name" />
          )}
          <AuthInput
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            onValue={setField("email")}
          />
          {signup && typed.email.includes("@") && (
            <AuthInput
              name="confirm_email"
              label="Confirm email"
              type="email"
              autoComplete="off"
              onValue={setField("confirmEmail")}
              problem={emailMismatch ? "Emails don't match yet." : ""}
            />
          )}
          {mode !== "forgot" && (
            <AuthInput
              name="password"
              label="Password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              onValue={setField("password")}
            />
          )}
          {signup && typed.password !== "" && (
            <AuthInput
              name="confirm_password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              onValue={setField("confirmPassword")}
              problem={passwordMismatch ? "Passwords don't match yet." : ""}
            />
          )}
          {mode === "signup" && (
            <>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="terms" required className="mt-1 h-5 w-5 shrink-0" />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="font-medium text-primary underline">
                    Terms of Service
                  </Link>{" "}
                  and have read the{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="font-medium text-primary underline"
                  >
                    Privacy Policy
                  </Link>
                  . <span className="text-muted-foreground">(Required)</span>
                </span>
              </label>
              <MarketingConsentFields
                optedIn={mkOptIn}
                channels={mkChannels}
                onChange={(o, c) => {
                  setMkOptIn(o);
                  setMkChannels(c);
                }}
              />
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-primary">
              {message}
            </p>
          )}
          <Button type="submit" disabled={busy} className="min-h-12 w-full">
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
          </Button>
        </form>
        <Button
          variant="link"
          className="mt-2 px-0"
          onClick={() => {
            setMode(mode === "forgot" ? "signin" : "forgot");
            setError("");
            setMessage("");
            setTyped({ email: "", confirmEmail: "", password: "", confirmPassword: "" });
          }}
        >
          {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
        </Button>
        {mode !== "forgot" && googleId && (
          <>
            <div className="my-5 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex justify-center" ref={googleButton} />
          </>
        )}
        <Button asChild variant="ghost" className="mt-5 min-h-12 w-full">
          <Link to={next === "checkout" ? "/checkout" : "/menu"}>Continue as guest</Link>
        </Button>
      </div>
    </section>
  );
}

function AuthInput({
  name,
  label,
  type = "text",
  autoComplete,
  minLength,
  onValue,
  problem,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  minLength?: number;
  onValue?: (value: string) => void;
  problem?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        aria-invalid={Boolean(problem)}
        onChange={onValue ? (e) => onValue(e.target.value) : undefined}
        className="mt-2 w-full rounded-lg border bg-background px-3 py-3 text-sm"
      />
      {problem && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {problem}
        </p>
      )}
    </div>
  );
}
