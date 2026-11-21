# Trip-to-Pay — Web MVP Design

Date: 2026-11-21 · Status: awaiting approval

## Intent

Trip-to-Pay is business travel where nobody fills in a claim: a policy-funded
virtual card per trip, GPS-verified mileage, and a claim that builds, checks and
pays itself when the trip closes (see the October 2026 concept deck).

This MVP is a **demo for the co-founder who pitched the idea**. It should make
the concept tangible — what the employee sees, what finance sees, and how the
policy/SARS rules behave — and be a codebase the two of them keep building on.
It is not a pilot product: no real money, no real users.

**Success:** the partner opens one link, plans a trip, swipes the card (and gets
declined at a bar), logs a drive, closes the trip, sees the claim build itself
and get "paid", then flips to the finance console and sees the exception, the
journal and the payroll codes — and wants to keep going.

## Goals

- Employee web app (shown in a phone frame on desktop, full-screen on phones)
  covering Plan → Approve → Fund → Travel → Capture → Close → Settle.
- Finance console covering Control → Account → Report (exceptions, journal,
  payroll codes, CSV export) and an editable policy.
- A real, tested **policy & SARS engine** (pure TypeScript) — the part
  Trip-to-Pay would actually own.
- A **demo controls** panel to drive events the real world would produce (card
  swipes, GPS drives, advancing the clock, resetting data).
- Sleek, convention-following design in the deck's visual language.

## Non-goals

- Real card issuing, authorisation, PayShap/EFT payouts, KYC — simulated.
- Real GPS tracking — drives are simulated with an animated route.
- Login/auth, multi-tenant, multi-user sync, a server database.
- Flight/hotel booking engine — bookings are seeded, read-only.
- ERP/payroll connectors — CSV export only (matches deck's pilot phase).
- Foreign trips, multi-currency.

## Anti-goals

- Looking like a generic admin template. It must feel like a fintech product.
- Implying real money moved. Simulated rails are labelled "Simulated" in the UI.
- Engine logic buried in UI components — that's the part worth keeping.

## Constraints

- Web only; must work at phone width (375px) and desktop.
- No backend required: state lives in the browser (localStorage), seeded on
  first load, resettable.
- SARS figures for 2026/27 from the deck: R4.95/km (code 3703), deemed local
  meals & incidentals R595/day; excess mileage rate → PAYE (code 3702).
- Currency ZAR, formatted `R 1 139.40` (space thousands separator, SA style).

## Approaches considered

1. **Single Next.js app, in-browser simulated data (chosen).** One link, fast to
   build, live interactions. Rules engine and bank rails behind clean interfaces
   so a server/DB can be added later. Trade-off: each browser has its own data.
2. Next.js + database + auth. Shared state and closer to a pilot, ~2× the work
   plus hosting/accounts. Premature before the idea is validated.
3. Figma clickable prototype. Pretty but nothing runs; can't be built on.

Chosen by Claude (the user handed over the "how"); user approved proceeding.

## Architecture

```
src/
  engine/        pure TS, no React — policy, allowance, authorisation,
                 mileage, claim builder, journal, payroll codes, CSV (unit-tested)
  rails/         BankRails interface + SimulatedBank (issueCard, authorise via
                 engine, settle, payout). Real partner slots in here later.
  store/         Zustand store persisted to localStorage; seed data; demo clock
  app/           Next.js App Router routes
  components/    UI (phone frame, card, tiles, tables, demo panel…)
```

Authorisation follows the real issuer-processor pattern ("just-in-time"
auth): the simulated card network asks `engine.authorise()` before approving,
so "rules at the till" is literally how it works.

**Stack (Claude's call):** Next.js (App Router) + TypeScript, Tailwind CSS,
Zustand (persist), lucide-react icons, Vitest for engine tests. Fonts: Space
Grotesk (headings, matches deck) + DM Sans (body). Deploy target: Vercel.

## Domain model

- **Policy** — dining cap/day (default R595), dining over-cap mode
  (`decline` | `flag`), mileage rate paid (default R4.95) vs SARS rate R4.95,
  blocked merchant categories (alcohol/bars, entertainment, cash withdrawal),
  hotel cap per night by grade × city, incidentals/day, slip-required threshold
  (amount > R50, where a VAT invoice is needed), auto-approve if within budget.
- **Employee** — name, grade (A/B/C), bank account (masked).
- **Trip** — destination city, dates, purpose, status
  (`requested | approved | active | closed | paid`), budget breakdown,
  card, transactions, drives, receipts, bookings, claim.
- **Card** — virtual, last4, expires on trip end date, status active/expired.
- **Transaction** — merchant, category (MCC group), amount, time,
  status approved/declined, decline reason, needs slip?, slip attached?
- **Drive** — from → to, km, start/end time, purpose, `gps: true|false`,
  route points (for the SVG map).
- **Out-of-pocket receipt** — e.g. parking slip paid personally; reimbursable.
- **Claim** — card spend (settled, not paid out), mileage (km × rate, split
  3703/3702), out-of-pocket, exceptions, amount payable to employee.
- **Exception** — rule triggered, amount, suggested action
  (Recover / Ask reason / Approve once), resolution.
- **Journal entry** — Dr Meals / Travel / Accommodation / Mileage, Cr Card
  clearing / Reimbursements.

## Engine rules

| Rule | Behaviour |
|---|---|
| Allowance | hotel cap(grade, city) × nights + dining cap × days + incidentals × days + transport estimate. Computed live as the trip is planned. |
| Auto-approve | Requested budget within allowance → approved + card issued instantly. Otherwise "Needs manager" (one-tap approve in finance console). |
| Merchant block | Blocked category → decline "Blocked by policy". |
| Dining cap | Day's dining + swipe > cap → decline (mode `decline`) or approve + exception (mode `flag`). |
| Budget | Swipe > remaining trip budget → decline "Over trip budget". |
| Card validity | Swipe outside trip dates / after close → decline "Card expired". |
| Evidence | Approved txn > R50 → needs slip; unmatched slips at close → exception "Ask for slip". |
| Mileage | GPS km × company rate. Up to R4.95/km → 3703 non-taxable; excess per km → 3702 taxable. Non-GPS drive → exception "Ask reason". |
| Claim | Payable = mileage + out-of-pocket − nothing else (card spend is already settled). Zero exceptions → auto-paid on confirm; otherwise paid excluding disputed lines, exceptions to finance. |
| Journal | Per closed trip, Dr expense categories / Cr card clearing (card spend) and Cr reimbursements (payout). Aggregated in console. |

## Screens

### Employee app (`/app`, phone frame on desktop)
1. **Home** — "Hi Thandi", active trip title + status chip, dark budget card
   (left / total, progress), four tiles: Card, Mileage, Bookings, Receipts
   (live values), orange **Close trip** button. No active trip → "Plan a trip".
   Past trips listed below.
2. **Plan trip** — city, dates, purpose, (grade from profile). Live allowance
   breakdown as you type. Submit → in-policy auto-approval → card-issued moment
   (card animates in, "Added to wallet").
3. **Wallet** — virtual card (tap to reveal number/CVV, expires date), "Dining
   today R245 / R595" progress, transactions list with declined lines in orange
   and reason. Patterns from Apple Wallet / Mercury / Brex.
4. **Mileage** — trip total km, drive list; drive detail with SVG route map,
   km, "GPS-verified", R at rate, purpose. "Start drive" (simulated live
   tracking with counter) and "Add manually" (marked no-GPS).
5. **Receipts** — matched vs needing slip; "Attach slip" (simulated upload →
   matched, VAT split shown). "Add out-of-pocket" (e.g. parking).
6. **Bookings** — seeded flight + hotel, "within cap" badges.
7. **Close trip → Claim ready** — card spend settled, mileage, out-of-pocket,
   **Paid to you** (dark card), policy check chip (0 exceptions / N to review),
   **Confirm** → payout animation "Paid via PayShap · Simulated".
Bottom tab bar: Home · Wallet · Mileage · Profile.

### Finance console (`/finance`, sidebar layout like Revolut Business/Airwallex)
1. **Overview** — KPIs (trips closed, % auto-approved, exceptions open,
   median time to pay), exceptions table with one-click suggested actions,
   "Posted automatically" journal panel, payroll codes panel.
2. **Trips** — all trips, filterable by status; row → trip detail (timeline of
   the nine stages, lines, claim).
3. **Policy** — edit caps, rates, blocked categories, over-cap mode. Changes
   apply to new swipes immediately (great for playing around).
4. **Exports** — download journal CSV and payroll CSV.

### Landing (`/`)
Short hero in the deck's style + two big entry points (Employee app, Finance
console) + "Demo mode — no real money moves" note.

### Demo controls (floating panel, available on all pages)
- Swipe card at preset merchants (Spice Route Café R245 meals, Airport taxi
  R380, Late-night bar R180, Hotel incidentals, custom amount/category).
- Simulate GPS drive (preset routes) / add non-GPS drive.
- Advance demo clock by a day.
- Reset demo data.

## Seed data

Company "Acme Engineering (Pty) Ltd". Signed-in employee **Thandi Mokoena**,
grade B, with an active trip "Durban client visit" (3 days) mid-way, some
transactions (incl. one declined), drives and bookings — matching the deck's
mockups. ~25 closed trips for other employees (N. Dlamini, P. van Wyk,
S. Naidoo, …) with a few open exceptions mirroring the deck so the console is
alive. A demo clock pinned to the active trip's day 2.

## Testing

Vitest unit tests for every engine rule (allowance, each decline reason,
flag mode, mileage split 3703/3702, claim payable, journal balances, CSV).
UI verified by running the app and screenshotting key flows with Playwright.

## Left to the builder

Exact visual details, component breakdown, animation choices, seed names/
amounts beyond the above, city cap figures (sensible SA values, e.g. JHB/CPT/
DBN hotel caps R1 600–R2 200/night for grade B).

## Calls Claude made (check these)

- Slip needed above R50 (SA abridged tax invoice threshold).
- Dining over-cap defaults to `decline`, switchable to `flag` in Policy.
- Exceptions don't block payout of undisputed lines.
- Desktop shows the employee app inside a phone frame.
- Deploy to Vercel — to confirm with the user before publishing anything.
