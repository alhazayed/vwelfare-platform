# Deploying Vwelfare to Vercel

## Your Supabase project is already live
- **URL:** https://wyzezyctpvlohuuhzyof.supabase.co
- **Region:** EU Frankfurt (eu-central-1)
- **Tables:** 18 tables with RLS, seeded assessment data
- **Edge Functions:** create-invitation, submit-assessment, add-medication

## Deploy to Vercel — 3 steps

### Step 1: Extract this zip and open a terminal in the folder

### Step 2: Run this single command
```bash
npx vercel --prod
```

When prompted:
- **Set up and deploy?** → Y
- **Which scope?** → alhazayed-1540s-projects
- **Link to existing project?** → N
- **Project name?** → vwelfare-platform
- **Directory?** → ./  (press Enter)
- **Override settings?** → N

### Step 3: Add environment variables in Vercel dashboard

Go to: vercel.com/alhazayed-1540s-projects/vwelfare-platform/settings/environment-variables

Add these two variables for Production:

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://wyzezyctpvlohuuhzyof.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5emV6eWN0cHZsb2h1dWh6eW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDgxNjcsImV4cCI6MjA5NTIyNDE2N30.PwW6A4LsuGOvQvl1m6EsOSwtHvB7yvfvR1GXIaS7KKQ |

Then click **Redeploy** to apply the variables.

## Your app will be live at:
https://vwelfare-platform.vercel.app

## What you'll see on first load:
- Sign-in page (bilingual AR/EN, password + magic link)
- Home dashboard after sign-in
- Mood logging — writes directly to Supabase

## To create the first admin account:
In Supabase dashboard → Authentication → Users → Invite user
Then update their role in the profiles table:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';
```
