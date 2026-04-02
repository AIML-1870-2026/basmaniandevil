# Drug Safety Explorer — Project Specification

## Overview

A single-page web application that allows users to compare two drugs side-by-side using live data from the OpenFDA API. The goal is to surface clear, useful drug safety information — adverse events, recalls, and label warnings — in a way that is easy for a non-expert to understand.

---

## Tech Stack

- **HTML** — semantic, accessible markup
- **TypeScript** — compiled to JS, no frameworks needed (vanilla TS)
- **CSS** — plain CSS (no Tailwind, no preprocessors), clean and readable
- **Build tool** — Vite (simplest setup for vanilla TS + static deploy)
- **Deployment** — GitHub Pages (via `vite build` output to `dist/`)

No backend. All API calls are made client-side directly to OpenFDA.

---

## Core Features

### 1. Drug Search Inputs
- Two search input fields, side by side, labeled **Drug A** and **Drug B**
- Each input queries the OpenFDA `/drug/label.json` endpoint as the user types (debounced, ~400ms) to suggest matching drug names
- A simple dropdown autocomplete list appears under each field with up to 6 suggestions
- User selects a drug → results load automatically
- A "Load Example" button pre-fills Warfarin and Ibuprofen so the page is never empty on arrival

### 2. Results Panel — Side-by-Side Comparison
Once both drugs are selected, display results in two columns (one per drug) with three tabbed sections each:

#### Tab 1: Adverse Events
- Query: `/drug/event.json?search=patient.drug.medicinalproduct:"DRUG_NAME"&count=patient.reaction.reactionmeddrapt.exact&limit=10`
- Display: a ranked list of the top 10 most-reported adverse reactions with report counts
- Include a note: *"Report counts reflect voluntary submissions and do not indicate how common these events actually are."*

#### Tab 2: Recalls
- Query: `/drug/enforcement.json?search=brand_name:"DRUG_NAME"&limit=10`
- Display: a list of recall events, each showing:
  - Recall date
  - Reason for recall
  - Classification badge: **Class I** (red), **Class II** (orange), **Class III** (yellow)
  - Recalling firm
- If no recalls found: display a clear "No recall records found" message

#### Tab 3: Label Info
- Query: `/drug/label.json?search=openfda.brand_name:"DRUG_NAME"&limit=1`
- Display the following fields if present (skip gracefully if absent):
  - **Warnings** — truncated to ~300 chars with a "Show more" toggle
  - **Drug Interactions** — truncated to ~300 chars with a "Show more" toggle
  - **Contraindications** — truncated to ~300 chars with a "Show more" toggle
  - **Indications and Usage** — what the drug is prescribed for

### 3. Disclaimer & Attribution
- A dismissible banner at the top of the page:
  > *"This tool is for educational purposes only. It is not medical advice. Always consult a healthcare professional."*
- A footer containing the required OpenFDA attribution:
  > *"This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product."*

---

## UX & Design Notes

- **Layout**: Two-column results panel on desktop; single column stacked on mobile
- **Loading states**: Each drug column shows a spinner/skeleton while its data loads
- **Error states**: If a drug name returns no results, show a clear inline message: *"No data found for '[drug name]'. Try a generic name (e.g. 'ibuprofen' instead of 'Advil')."*
- **Empty tabs**: If a tab has no data, show a short explanation rather than a blank screen
- **Color palette**: Clean and professional — white background, dark text, blue accents for interactive elements, red/orange/yellow only for recall severity badges
- **Typography**: System font stack, clear hierarchy with `h1`, `h2`, section labels

---

## File Structure

```
/
├── index.html
├── src/
│   ├── main.ts          # Entry point
│   ├── api.ts           # All OpenFDA fetch functions
│   ├── ui.ts            # DOM rendering functions
│   └── types.ts         # TypeScript interfaces for API responses
├── style.css
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## API Reference

Base URL: `https://api.fda.gov`

All requests are GET, no API key required for up to 240 req/min.

| Purpose | Endpoint |
|---|---|
| Drug name autocomplete | `/drug/label.json?search=openfda.brand_name:"QUERY"&limit=6` |
| Adverse events | `/drug/event.json?search=patient.drug.medicinalproduct:"NAME"&count=patient.reaction.reactionmeddrapt.exact&limit=10` |
| Recalls | `/drug/enforcement.json?search=brand_name:"NAME"&limit=10` |
| Label info | `/drug/label.json?search=openfda.brand_name:"NAME"&limit=1` |

Handle API errors (404, 400, network failures) gracefully — show an informative message, never crash.

---

## Out of Scope

- No user accounts or saved history
- No backend or database
- No drug-drug interaction checking (OpenFDA does not provide this directly)
- No charting/visualization (keep it functional and readable)
```
