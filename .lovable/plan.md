# Melderegister Request Helper

A German-language web app that helps users prepare, submit, and track formal address lookup requests (Melderegisterauskunft) to the correct Einwohnermeldeamt. **No private data is scraped or queried** — the app only generates properly formatted requests that the user submits to municipal authorities.

## Legal framing (shown in UI)
- All requests are formal Auskunft nach §44/§45 BMG.
- User must declare a legitimate purpose (Zweckbindung). Commercial use, address trading, and stalking are explicitly refused in the ToS gate.
- The app never claims to return addresses itself — results are typed back in by the user when the Meldeamt responds.

## User flow
1. **Sign up / log in** (email+password and Google).
2. **Dashboard** — list of cases with status: Draft → Submitted → Awaiting reply → Answered / Negative / Refused.
3. **New case wizard**:
   - Step 1: Searched person (Vorname, Nachname, Geburtsdatum optional, Geschlecht optional, last known address fields).
   - Step 2: Last known city / PLZ → resolved via **OpenPLZ API** to find the right municipality and Meldebehörde (curated mapping of Gemeinde → Meldeamt contact, seeded from a JSON file we bundle; fallback to "search your city's website").
   - Step 3: Request type — **Einfache** (name + current address) or **Erweiterte** (also prior addresses, legal reps, date of death, etc.) with explanation of when each applies and required justification text for Erweiterte.
   - Step 4: Requester details (your name, address, contact) + purpose statement + declaration that data won't be used for advertising/address trade.
   - Step 5: Review → generate PDF letter (German, formatted to typical Meldeamt template) + cover page with Meldeamt address; optionally pre-fill known online portal links.
4. **Submit & track** — user marks case as submitted (date, channel: post / portal / email), uploads scanned response PDF when it arrives, records outcome and the address received (encrypted at rest, only visible to the case owner).
5. **Reminders** — auto follow-up reminder after 4 weeks of no response.

## Out of scope (explicit)
- No automated submission to Meldeämter (most don't accept it; would risk abuse).
- No scraping, no third-party people databases, no social media lookup.
- No sharing of cases between users.

## Technical implementation

**Stack:** TanStack Start + Lovable Cloud (Supabase) + OpenPLZ public API.

**Auth:** Email/password + Google via Lovable Cloud. Protected routes under `_authenticated/`. Separate `user_roles` table; first user can be promoted to admin (admin can edit the Meldeamt directory).

**Database (Lovable Cloud):**
- `profiles` — user profile (name, postal address, contact) auto-created on signup.
- `user_roles` — (`user_id`, `role`) with `app_role` enum, `has_role()` security-definer.
- `meldeaemter` — curated directory: `gemeinde_key` (AGS), `name`, `street`, `plz`, `city`, `email`, `phone`, `online_portal_url`, `accepts_email_bool`. Seed via migration.
- `cases` — owner_id, status enum, request_type enum (`einfach`/`erweitert`), purpose_text, created_at, submitted_at, channel, follow_up_at.
- `case_subjects` — searched person fields (linked to case).
- `case_responses` — outcome enum (`address_received`/`negative`/`refused`/`no_reply`), response_date, address received fields, uploaded_file_path.
- All tables RLS-scoped to `owner_id = auth.uid()`. `meldeaemter` readable by all authenticated users.

**Server functions (`createServerFn` + `requireSupabaseAuth`):**
- `lookupMunicipality(plz | cityName)` — proxies OpenPLZ API server-side, joins to `meldeaemter` directory.
- `createCase`, `updateCase`, `submitCase`, `recordResponse`.
- `generateRequestPdf(caseId)` — renders the formal Auskunftsersuchen as PDF (use `pdf-lib`, Worker-compatible) and returns a download URL. Server function generates and stores in Supabase Storage, returns signed URL.

**Server routes:**
- `/api/public/cron/follow-up-reminders` — daily check for cases overdue >28 days; sends in-app notification (and email if Resend connector added later).

**Frontend:**
- German UI (primary), with all copy reviewed for legal accuracy.
- Dashboard, case wizard (multi-step form with zod validation), case detail view with PDF download + response upload.
- Clear legal disclaimer on every page; explicit consent gate on signup.

## Build order
1. Enable Lovable Cloud, configure Google sign-in.
2. Schema migrations (profiles, user_roles, meldeaemter seed, cases, case_subjects, case_responses) with GRANTs and RLS.
3. Auth pages (`/auth`) + `_authenticated` layout already managed.
4. OpenPLZ lookup server fn + Meldeamt resolver.
5. Case wizard UI + create/update server fns.
6. PDF generator server fn with `pdf-lib`.
7. Dashboard + case detail + response recording.
8. Follow-up cron route.
9. Legal pages (Impressum, Datenschutz, Nutzungsbedingungen with anti-abuse clause).

## What I'll ask before building
- Confirm German as primary UI language (with optional English toggle).
- Confirm requester must provide their real ID details (most Meldeämter require it).
- Whether to include a paid tier (Meldeamt fees are €5–€15 per request — we don't collect them, but we could let users record what they paid).