# Supabase Environment Variables

This document describes the environment variables required for Supabase authentication in Swaply 2025.

## Required Variables

Create a `.env.local` file in the project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get These Values

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** > **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Security Notes

- The `NEXT_PUBLIC_` prefix means these variables are exposed to the browser. This is intentional for Supabase client-side authentication.
- The anon key is safe to expose as it only allows operations permitted by your Row Level Security (RLS) policies.
- Never expose your `service_role` key in client-side code.

## Example

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
