# Vwelfare Digital Mental Health Platform

مركز الرفاه لخدمات الصحة النفسية — Amman, Jordan

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Hosting:** Vercel (Frankfurt region)

## Project structure
```
src/
  app/
    auth/            # sign-in, accept-invite, forgot-password
    (dashboard)/     # patient app (home, mood, assessments, medications, messages, journal, library, profile)
    clinician/       # clinician portal
    admin/           # admin panel
    api/             # Next.js API routes
  components/
    ui/              # shared UI components
    auth/            # auth-specific components
  lib/
    supabase.ts      # Supabase client helpers
  types/
    database.ts      # TypeScript types (regenerate with: supabase gen types typescript)
```

## Supabase project
- **Project ID:** wyzezyctpvlohuuhzyof
- **Region:** eu-central-1 (Frankfurt)
- **URL:** https://wyzezyctpvlohuuhzyof.supabase.co

## Migrations applied
1. `create_profiles_and_user_tables` — profiles, patient_profiles, clinician_profiles, RLS, triggers
2. `create_assessment_tables` — definitions, items, assignments, submissions, responses
3. `create_clinical_data_tables` — mood_logs, journal_entries, medications, medication_alerts, messages
4. `create_content_and_audit_tables` — content_articles, notification_log, audit_log
5. `seed_assessment_definitions` — PHQ-9, GAD-7, PCL-5, MDQ, AUDIT-C (with items)
6. `create_invitation_system` — invitations table, platform_settings with defaults

## Edge Functions deployed
- `create-invitation` — Admin creates patient invite (JWT-verified, admin role required)
- `submit-assessment` — Atomic assessment submission with scoring and high-risk detection
- `add-medication` — Adds medication + triggers DrugBank interaction check

## Environment variables required
See `.env.local.example`. Critical values to retrieve from Supabase dashboard:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API → Project API keys → anon/public
- `SUPABASE_SERVICE_ROLE_KEY` — Settings → API → Project API keys → service_role (keep secret)

## Development setup
```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase keys
npm run dev
```

## Deploy to Vercel
```bash
vercel --prod
# Set environment variables in Vercel dashboard
```

## ⚠️  Before Sprint 3
Arabic assessment translations for PHQ-9, GAD-7, PCL-5, MDQ, AUDIT-C must be replaced
with validated peer-reviewed translations. Current question_ar values are placeholders.

## Design mockups
All 12 interactive HTML mockups (patient app, clinician portal, admin panel, superadmin)
are in the project delivery folder from the design phase.

## Technical specification
`vwelfare_technical_spec.docx` — full schema, API contracts, sprint plan.
