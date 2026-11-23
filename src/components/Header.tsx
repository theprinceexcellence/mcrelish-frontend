import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Menu, ShoppingBag, X, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/menu", label: "Menu" },
  { to: "/deals", label: "Deals" },
  { to: "/locations", label: "Locations" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { user, profile, ready } = useAuth();
  const { count, setCartOpen, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl transition-shadow ${
        scrolled ? "shadow-header" : ""
      }`}
    >
      <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="mx-auto grid h-[calc(var(--header-height)-1px)] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:h-auto lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8 lg:py-3">
        <Dialog.Trigger asChild>
          <Button variant="ghost" size="icon" className="h-11 w-11 justify-self-start rounded-full lg:hidden" aria-label="Open menu" title="Open menu">
            <Menu className="size-[18px]" aria-hidden="true" />
          </Button>
        </Dialog.Trigger>
        <div className="flex min-w-0 items-center justify-center gap-8 lg:justify-start">
          <Logo compact />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    activeProps={{ className: "text-foreground font-medium" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex shrink-0 items-center justify-self-end gap-2">
          {ready && user && user.roles.length > 0 && (
            <Button asChild variant="ghost" className="hidden h-11 px-2 lg:inline-flex sm:px-3" aria-label="Staff dashboard">
              <Link to="/admin"><LayoutDashboard aria-hidden="true" /><span className="hidden xl:inline">Dashboard</span></Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="hidden h-11 px-2 lg:inline-flex sm:px-3" aria-label={user ? "Your account" : "Customer sign in"}>
            <Link to={user ? "/account" : "/auth"}><UserRound aria-hidden="true" /><span className="hidden xl:inline">{ready && user ? "Account" : "Sign in"}</span></Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${hydrated ? count : 0} items`}
            title="Open cart"
            className="relative h-11 w-11 rounded-full lg:border lg:border-border lg:bg-card hover:text-primary"
          >
            <ShoppingBag className="size-[18px] lg:size-5" aria-hidden="true" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Button>
          <Link to="/menu" className="btn-primary hidden lg:inline-flex">
            Order Now
          </Link>
        </div>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="mobile-nav-overlay fixed inset-0 z-[60] bg-foreground/12 lg:hidden" />
        <Dialog.Content aria-describedby={undefined} className="mobile-nav-panel safe-bottom fixed inset-y-0 left-0 z-[61] w-[min(68vw,260px)] overflow-y-auto border-r bg-background px-4 pt-4 shadow-card lg:hidden">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-lg font-semibold">McRelish</Dialog.Title>
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Close menu" title="Close menu"><X className="size-4" aria-hidden="true" /></Button></Dialog.Close>
          </div>
          <div className="my-3 border-y py-2.5">
            {user && profile?.full_name && <p className="mb-1 text-xs font-medium text-muted-foreground">Hi, {profile.full_name.split(" ")[0]}</p>}
            <Button asChild variant="ghost" className="h-9 w-full justify-start px-0 text-sm"><Link to={user ? "/account" : "/auth"} onClick={() => setOpen(false)}><UserRound className="size-4" aria-hidden="true" />{user ? "Your account" : "Sign in / Create account"}</Link></Button>
            {user && user.roles.length > 0 && (
              <Button asChild variant="ghost" className="h-9 w-full justify-start px-0 text-sm"><Link to="/admin" onClick={() => setOpen(false)}><LayoutDashboard className="size-4" aria-hidden="true" />Dashboard</Link></Button>
            )}
          </div>
          <nav aria-label="Mobile">
          <ul>
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link
                to="/menu"
                onClick={() => setOpen(false)}
                className="btn-primary w-full !py-2 text-sm"
              >
                Order Now
              </Link>
            </li>
          </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
