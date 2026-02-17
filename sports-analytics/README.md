# EdgeJournal

A sports betting probability engine and prediction journal. AI-powered probabilities, model comparison, and notebook-style tracking.

## Features

- **Betting predictions** – Ask questions, get probability estimates + EV
- **Multi-model comparison** – Grok (default), GPT, Claude, Gemini
- **Notebooks** – Organize predictions by sport/tournament
- **Dashboard** – Trending games, quick prompts, saved notebooks
- **Dark premium UI** – Journal/portfolio feel

## Tech Stack

- Next.js 14 (App Router)
- TailwindCSS + shadcn/ui + Framer Motion
- Supabase (Auth + Postgres)

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env.local` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` – for auth and DB
   - `XAI_API_KEY` – for Grok predictions (required)
   - Optional: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` for compare mode

3. **Database**

   Run the migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project (SQL editor or `supabase db push`).

4. **Run**

   ```bash
   npm run dev
   ```

## Routes

| Route        | Auth | Description                    |
| ------------ | ---- | ------------------------------ |
| `/`          | No   | Guest homepage, prompt input   |
| `/login`     | No   | Login                          |
| `/register`  | No   | Register                       |
| `/dashboard` | Yes  | Journal-style dashboard        |
| `/notebooks` | Yes  | List and create notebooks      |
| `/notebooks/:id` | Yes | Notebook entries            |
| `/settings`  | Yes  | Model defaults, etc.           |
| `/profile`   | Yes  | Account info                   |

## Rate Limits

- **Guests:** ~10 predictions/day (configurable)
- **Registered users:** ~50 predictions/day

*For entertainment purposes only. Not financial advice.*
