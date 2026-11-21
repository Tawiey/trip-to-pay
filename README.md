# Trip-to-Pay — interactive MVP

Business travel where nobody ever fills in a claim. Spend happens on a policy-funded
virtual card, kilometres come from GPS, and when the trip closes the claim builds,
checks and pays itself. Finance sees exceptions, not claims.

This is a **demo build** for exploring the concept from the October 2026 concept deck.
No real money moves: card issuing, authorisation and PayShap payouts are simulated, and
all data lives in your browser.

## Try it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + state tests (Vitest)
```

- **`/app`** — the employee app (shown in a phone frame on desktop). You're Thandi,
  day 2 of a Durban client visit.
- **`/finance`** — the finance console: exceptions, auto-posted journal, payroll codes
  3703/3702, trip detail, a live policy editor and CSV exports.
- **Demo controls** (docked next to the phone, or the floating button) play the real
  world: swipe the card at preset merchants, simulate GPS drives, move the clock, reset.

A good five-minute story: swipe at the **Late-night bar** (declined at the till) →
swipe **Cargo Hold** dinner (over the R595 dining cap, declined) → **Start drive** in
Mileage → **Snap slip** in Receipts → **Close trip** → **Confirm** (paid via simulated
PayShap) → open the **Finance console**, recover N. Dlamini's dining overage, approve
Lerato's trip → in **Policy** switch dining to *Allow & flag* and swipe again.

## How it's built

```
src/
  engine/     Pure TypeScript — the part Trip-to-Pay owns. No React.
              policy.ts     SARS 2026/27 figures + default company policy
              allowance.ts  trip budget from grade × city × dates
              authorise.ts  just-in-time card authorisation (rules at the till)
              mileage.ts    km × rate, split 3703 non-taxable / 3702 taxable
              claim.ts      builds the claim + exceptions when a trip closes
              ledger.ts     journal lines and payroll codes
              csv.ts        exports
  rails/      BankRails interface + SimulatedBank (issue card, authorise, payout).
              A licensed partner (BIN sponsor / issuer processor / PayShap) implements
              the same interface later.
  store/      actions.ts — pure state transitions (tested)
              useDemo.ts — Zustand store persisted to localStorage
              seed.ts    — deterministic demo data (Thandi + ~28 company trips)
  app/        Next.js App Router pages: /, /app/*, /finance/*
  components/ UI: phone frame, wallet card, route map, demo controls, finance shell
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, lucide-react, Vitest. Type: Bricolage Grotesque (headings) + Instrument Sans (body).

## Where to take it next

- Swap `rails/simulated.ts` for a real partner sandbox (card issuing + JIT auth webhook,
  PayShap payouts).
- Move `store/actions.ts` behind an API with a database and logins so several people
  share one company.
- Native mobile app for background GPS tracking.
- Payroll/ERP connectors (Sage, SimplePay, PaySpace, Xero) instead of CSV.

Design and plan: `docs/superpowers/specs/` and `docs/superpowers/plans/`.

*SARS figures (R4.95/km, R595/day) are from Notices 7182 and 7174 as cited in the deck.
Illustrative only — not tax advice.*
