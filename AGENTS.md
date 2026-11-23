<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the anonymous cart in validated browser localStorage and rehydrate catalog details from product IDs; returning customers retain selections without storing personal checkout details there.
- The managed menu uses `menu_sections` and `menu_items` for names, descriptions, visibility, images and priority; bundled product IDs preserve established customization only. Public catalog reads use a server function and shared query cache, never mutable module-global catalog data.
- Checkout loads the managed catalog and reprices every line from catalog structure plus `menu_prices`, adding the chosen delivery fee; client prices are never trusted. A database trigger mirrors managed item prices into `menu_prices` for compatibility.
- Menu images are uploaded through the PHP backend (admin-only); upload paths are stored and resolved to browser-reachable URLs on catalog reads.
- Online payment opens the Paystack popup (src/lib/paystack-inline.ts, access_code from the backend), falling back to the hosted link if the script cannot load; only paid orders appear on the live board and trigger the WhatsApp alert (whatsapp block in the backend config); an order becomes paid only after server-side transaction verification (callback page or signed webhook at /api/payments/webhook on the PHP backend) matching tx_ref, NGN and amount.
- Guests reopen tickets with a per-order access token kept in localStorage; ticket reads go through a server function that requires reference + token.
- Admin rights are enforced by the PHP backend from the user's roles; the /admin page edits prices, availability and delivery fees through its API.
- The /admin dashboard is role-aware: `admin` sees all tabs, `staff` sees Live Orders + Menu Manager, `dispatcher` sees Live Orders only; role management goes through admin-verified server functions in src/lib/staff.functions.ts.
- Staff actions (order status, prices, store status, staff changes) are recorded in `audit_log` via src/lib/audit.ts (best-effort, never throws); analytics count only verified paid, non-cancelled orders, bucketed in Africa/Lagos time.
- `store_settings` (id=1) holds the open/closed toggle; the checkout server function refuses new orders when the store is closed.
- Pop-ups use `usePresence` + `data-state` CSS animations so they stay mounted until the exit animation ends.
- Optional customer accounts use PHP backend session tokens (X-Auth-Token) with owner-scoped profile access; public ordering remains available without sign-in.
- Profiles are created by the PHP backend at signup, and checkout only prefills customer fields from the authenticated profile; customers can still edit details per order.
- The backend is PHP+MySQL, called through src/lib/api.ts (set VITE_API_URL); Supabase has been removed.
- Confirmations use the in-app `useConfirm()` modal from src/components/ConfirmProvider.tsx; never native `alert`/`confirm`/`prompt`.
- The frontend builds as a static single-page app (TanStack Start `spa` mode): `VITE_API_URL=https://api.example.com npm run build` (the API must be reachable), then upload `.output/public` including `.htaccess`; `_shell.html` is the entry page.
- Admin UI: dashboard layout in src/routes/admin.tsx, shared pieces in src/components/admin/ui.tsx; modals use a stable scrollbar gutter (styles.css) and useScrollLock, so pages never shift.
- Preloader (src/components/Preloader.tsx): WebGL particle logo that builds during load then disperses; falls back to a static logo. The Jolly Fest countdown modal (src/components/PromoModal.tsx) is locked until 9 November 2026, waits for the preloader, and never loads afterwards.
- Scheduling and fee rules live in src/lib/campaign.ts and mirror the backend (OrderRules.php): delivery 16–30 Nov and pickup until 30 Nov, both Monday to Saturday (never Sunday), 12:00–20:00 Lagos at any minute; orders placed before 16 Nov paid a flat ₦1,500, later orders pay the zone fee. The GPS pin UI is commented out; delivery_lat/delivery_lng still show as a map link in Live Orders.
- Legal pages (/privacy, /terms) load from GET /api/legal/{slug} with bundled text in src/content as fallback; admins edit them in the dashboard's Legal Pages tab. Marketing consent (signup checkbox, account preferences) uses src/lib/marketing.ts and /api/auth/marketing.
- Bundle contents and promo prices are bundled product data (`includes`, `originalPrice` in src/data/menu.ts); the countdown modal targets DELIVERY_START in src/lib/campaign.ts.
