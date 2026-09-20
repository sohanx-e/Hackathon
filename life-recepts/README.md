# Your Life, In Receipts

**WebRush — 6-Hour Frontend Hackathon · Track: "Your Life, In Receipts"**

Your digital life is made up of hundreds of tiny moments — a song you played at 2 AM, something you bought, a transfer you made. This app takes the raw exhaust of that life (bank/card CSV exports and a Spotify streaming history) and turns it into one coherent, explorable story: a dashboard of what happened, and a chronological feed of the moments themselves.

## Live demo

- App: see the deployed link in the repo/submission
- Source: this repository, app code lives in [`life-recepts/`](.)

## What it does

- **Loads multiple real-world datasets** — a household ledger and a card-transactions export — each with a different schema, normalized into one shared `Txn` shape (`src/utils/csv.ts`). Bad rows, missing amounts, invalid dates and duplicates are dropped and counted rather than crashing the app.
- **Your story, moment by moment** — [`TimelineFeed`](src/components/TimelineFeed.tsx) merges every transaction with every Spotify play into a single reverse-chronological feed ("Spent at Swiggy", "Played *Blinding Lights*"), so spending and listening read as one narrative instead of two disconnected charts.
- **Live-computed stats** — income, expenses, net balance, average transaction, top category, flagged/fraud-review transactions — all derived on the fly from whatever the current filters produce, never hard-coded.
- **Interactive filtering** — a sticky filter bar (date range, category, transaction type, free-text search) drives every chart and stat card at once.
- **Visual breakdowns** — category spend, income vs. expenses over time, a spending timeline, and top transactions, built with Recharts and lazy-loaded so the first paint doesn't pay for chart code the user hasn't scrolled to yet.
- **Spotify analytics** — separately parses a streaming-history export (or its field-dictionary variant, if that's what's provided) into listening insights.
- **Auto-generated insights** — plain-language observations ("You spend most on X", "Your biggest transaction was Y") computed from the active dataset.
- **A searchable raw-data explorer** for anyone who wants to drop into the underlying rows.

## Why it's built this way

The problem statement is about turning many small, heterogeneous moments into a story — not just charting one CSV. So the app is deliberately built to **combine** sources rather than just visualize one:

- `src/utils/csv.ts` normalizes two structurally different transaction exports into one `Txn` type, so every downstream component (charts, stats, insights, timeline) works against a single shape regardless of source.
- `src/utils/timeline.ts` is the layer that actually tells the "life" story: it interleaves transactions and songs by timestamp into `Moment[]`, which is what makes the timeline feed possible.
- Failures are isolated per-dataset (`useCSVData`) — one bad file degrades gracefully instead of taking the whole dashboard down.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS 4 for styling
- Recharts for charts (code-split via `React.lazy`)
- Papaparse for CSV parsing
- lucide-react for icons

## Project structure

```
life-recepts/
├── public/data/          sample CSVs: household.csv, transactions.csv, spotify.csv
├── src/
│   ├── components/       presentational + chart components (one concern each)
│   ├── hooks/useCSVData.ts   loads & normalizes every dataset on mount
│   ├── utils/
│   │   ├── csv.ts         parsing + per-source normalization into Txn
│   │   ├── calculations.ts  totals, filters, category breakdowns, insights
│   │   ├── timeline.ts    merges transactions + Spotify plays into Moment[]
│   │   ├── formatting.ts  currency/date/number formatting (en-IN)
│   │   └── palette.ts     deterministic category → color mapping
│   └── types/index.ts     shared domain types (Txn, Dataset, Moment, ...)
└── vite.config.ts
```

## Running locally

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # type-check (tsc -b) + production build
npm run preview   # preview the production build
```

## Data

Sample CSVs live in `public/data/`. Swap in your own household ledger, card export, or Spotify streaming-history export (same filenames) to see the dashboard rebuild itself around your own data — nothing about the totals, charts or timeline is hard-coded to the sample set.

## Deployment

The app lives in this `life-recepts/` subfolder inside the repo. The root [`vercel.json`](../vercel.json) points Vercel's install/build/output at this subfolder so the project deploys correctly without any dashboard configuration.
