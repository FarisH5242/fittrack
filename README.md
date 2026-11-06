# FitTrack

A responsive fitness tracking web application built with Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase authentication, Lucide icons and Recharts.

## Current features

- White-and-blue responsive dashboard with sample statistics and chart
- Email/password signup and login using Supabase
- Server-protected dashboard and sign-out
- Navigation placeholders for workouts, routines, and progress

Workout statistics are **demo data**, not persisted fitness records.

## Local setup

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set your Supabase project URL and **publishable** key.
4. In Supabase Authentication > URL Configuration, set Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/confirm` as a redirect URL.
5. In Supabase Authentication > Email Templates > Confirm signup, set the confirmation link to `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`.
6. Run `npm run dev` and visit http://localhost:3000.

Do not commit `.env.local` or Supabase secret/service-role keys. Configure production HTTPS redirect URLs separately before deployment.

## Quality checks

Run `npm run lint` and `npm run build`.

## Next milestones

Workout database with RLS, exercise library, routine builder, workout logging, and real analytics.
