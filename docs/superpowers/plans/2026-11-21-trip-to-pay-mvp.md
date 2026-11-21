# Trip-to-Pay Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js web demo of Trip-to-Pay: employee app (phone frame), finance console, demo controls, backed by a tested policy & SARS engine and simulated bank rails.

**Architecture:** Pure-TS `engine/` (no React) holds all rules; `rails/` wraps it as a simulated issuer (JIT auth, payout); a Zustand store persisted to localStorage holds org state and exposes actions that call rails/engine. Next.js App Router pages render from the store (client components).

**Tech Stack:** Next.js 16 (App Router, TS), React 19, Tailwind CSS 4, Zustand 5, lucide-react, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-21-trip-to-pay-mvp-design.md`

## Global Constraints

- SARS 2026/27: `SARS_KM_RATE = 4.95` (code 3703), `SARS_DAILY_MEALS = 595`; excess company rate/km → code 3702.
- Slip required when approved amount `> 50`.
- Money stored as integer cents everywhere in engine/store; formatted `R 1 139.40` (narrow-space thousands, two decimals; whole rands without decimals allowed in big KPI numbers).
- Default dining over-cap mode `decline`.
- All payout UI labelled "Simulated".
- Works at 375px width and desktop; employee app inside phone frame at ≥ 768px.
- No server/database; localStorage key `trip-to-pay-demo-v1`; "Reset demo" restores seed.

## Review Focus

1. Swipe after the trip is closed → declined "Card expired" (test in Task 2).
2. Two swipes same day whose sum crosses dining cap → second declined (Task 2).
3. Company km rate below SARS rate → everything 3703, no 3702 negative (Task 3).
4. Closing a trip with zero drives/receipts → payable R 0.00, no crash (Task 3).
5. Corrupt/old localStorage state → store falls back to seed (Task 5, version check in persist `version`/`migrate`).

---

### Task 1: Scaffold + money/date utils

**Files:** Create Next app at repo root (`package.json`, `src/app/*`, `tsconfig.json`, `vitest.config.ts`), `src/engine/money.ts`, `src/engine/money.test.ts`.

**Produces:** `type Cents = number`; `rands(n: number): Cents`; `formatZAR(c: Cents, opts?: {whole?: boolean}): string`.

- [ ] `create-next-app` (TS, Tailwind, App Router, src dir, no ESLint prompts), add zustand, lucide-react, vitest.
- [ ] Test: `formatZAR(113940) === "R 1 139.40"`, `formatZAR(-14000) === "-R 140.00"`, `formatZAR(950000,{whole:true}) === "R 9 500"`.
- [ ] Implement, `npx vitest run` passes, commit.

### Task 2: Engine — types, policy, allowance, authorisation

**Files:** `src/engine/types.ts`, `src/engine/policy.ts`, `src/engine/allowance.ts`, `src/engine/authorise.ts`, tests alongside.

**Produces:**
- Types: `Grade = 'A'|'B'|'C'`; `City`; `MerchantCategory = 'meals'|'transport'|'lodging'|'fuel'|'parking'|'incidentals'|'alcohol'|'entertainment'|'cash'`; `Policy { diningCapPerDay: Cents; diningOverCapMode: 'decline'|'flag'; companyKmRate: Cents; blockedCategories: MerchantCategory[]; hotelCapPerNight: Record<Grade, Record<City, Cents>>; incidentalsPerDay: Cents; transportPerDay: Cents; slipThreshold: Cents }`; `Txn`, `Drive`, `Receipt`, `Trip`, `Card`, `Employee`, `Exception`, `Claim` per spec domain model.
- `DEFAULT_POLICY: Policy` (dining 59500, decline, km 495, blocked alcohol/entertainment/cash, slip 5000).
- `computeAllowance(policy, grade, city, startDate, endDate) → { nights, days, lodging, meals, incidentals, transport, total }`.
- `authorise(policy, trip, req: {merchant, category, amount, at: string /*ISO*/}) → { approved: true, flags: ExceptionRule[] } | { approved: false, reason: string }`.

Tests (values):
- [ ] Grade B, Durban, 14→16 Oct → nights 2, days 3, meals 3×59500.
- [ ] `alcohol` swipe → declined "Blocked by policy".
- [ ] Meals 24500 then meals 40000 same day → second declined "Over daily dining cap"; in `flag` mode approved with flag `dining_over_cap`.
- [ ] Amount > remaining budget → "Over trip budget".
- [ ] `at` after endDate or trip.status ≠ active → "Card expired".
- [ ] Implement, pass, commit.

### Task 3: Engine — mileage, claim, journal, payroll, CSV

**Files:** `src/engine/mileage.ts`, `src/engine/claim.ts`, `src/engine/ledger.ts`, `src/engine/csv.ts`, tests.

**Produces:**
- `mileagePay(policy, km: number) → { nonTaxable: Cents /*3703*/, taxable: Cents /*3702*/, total: Cents }`.
- `buildClaim(policy, trip) → Claim { cardSpend, mileageKm, mileage: {nonTaxable,taxable,total}, outOfPocket, payable, exceptions: Exception[] }` — exceptions: non-GPS drive (`ask_reason`), approved txn needing slip without slip (`ask_slip`), flagged over-cap txn (`recover`).
- `journalFor(trips: Trip[]) → JournalLine[] { account, side:'Dr'|'Cr', amount }` (Dr Meals/Transport/Accommodation/Incidentals/Mileage/Other, Cr Card clearing = card spend, Cr Reimbursements = payable); Dr total === Cr total.
- `payrollCodes(trips) → { code3703: Cents, code3702: Cents }`.
- `toCSV(rows: Record<string,string|number>[]) → string`.

Tests:
- [ ] 212 km at 495 → total 104940 (matches deck R1 049.40), taxable 0.
- [ ] Company rate 600: 100 km → nonTaxable 49500, taxable 10500. Rate 400: taxable 0.
- [ ] Deck example: card 266000, 212 km, parking 9000 → payable 113940, exceptions 0.
- [ ] Empty trip → payable 0, no exceptions.
- [ ] Journal balances; CSV escapes commas/quotes.
- [ ] Implement, pass, commit.

### Task 4: Simulated rails

**Files:** `src/rails/types.ts`, `src/rails/simulated.ts`, test.

**Produces:** `interface BankRails { issueCard(trip): Card; authorise(policy, trip, req): AuthResult; payout(employee, amount: Cents): { reference: string; method: 'PayShap'; simulated: true } }`; `simulatedBank: BankRails`. Card last4 random 4 digits, expiry = trip end. Test: payout reference format `PS-` + 8 chars.

### Task 5: Store + seed

**Files:** `src/store/seed.ts`, `src/store/useDemo.ts`.

**Produces:** `useDemo` Zustand store `{ policy, employees, trips, currentEmployeeId, clock: string; planTrip(input), swipe(req), simulateDrive(presetId|{from,to,km,gps,purpose}), attachSlip(txnId), addOutOfPocket(r), closeTrip(tripId), confirmClaim(tripId), approveTrip(tripId), resolveException(tripId, exId, action), updatePolicy(patch), advanceDay(), reset() }`. Persist with `version: 1`; `migrate` returns seed on mismatch; catch JSON errors. Seed per spec (Thandi grade B, Durban trip active on day 2; ~25 closed trips; open exceptions N. Dlamini / P. van Wyk / S. Naidoo). Hydration guard hook `useHydrated()`.

### Task 6: Design system + shell

**Files:** `src/app/globals.css` (tokens: navy #13202e, teal #0b7566, orange #e5823a, cream #f3f1ec, mist #e4e9ec), `src/app/layout.tsx` (Space Grotesk + DM Sans via next/font), `src/components/ui/*` (Button, Chip, Card, ProgressBar, Stat), `src/components/PhoneFrame.tsx`, `src/components/demo/DemoPanel.tsx`, `src/app/page.tsx` (landing).

### Task 7: Employee app

**Files:** `src/app/app/layout.tsx` (phone frame + tab bar), `src/app/app/page.tsx` (Home), `plan/page.tsx`, `wallet/page.tsx`, `mileage/page.tsx`, `receipts/page.tsx`, `bookings/page.tsx`, `claim/[id]/page.tsx`, `profile/page.tsx`, components in `src/components/app/*` (VirtualCard, TxnRow, RouteMap, Tile).

### Task 8: Finance console

**Files:** `src/app/finance/layout.tsx` (sidebar), `page.tsx` (Overview), `trips/page.tsx`, `trips/[id]/page.tsx`, `policy/page.tsx`, `exports/page.tsx`.

### Task 9: Verify + README

- [ ] `npx vitest run`, `npm run build` clean.
- [ ] Playwright screenshots of landing, home, wallet after bar decline, claim, finance overview, policy at 375px and 1440px; fix issues.
- [ ] README: what it is, run locally, structure, where to plug a real partner.
- [ ] Commit, push.
