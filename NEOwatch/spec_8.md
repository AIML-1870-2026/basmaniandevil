# NEO Watch — Project Specification

## Overview

**Project name:** NEO Watch  
**Description:** A clean, data-journalism-style single-page dashboard that surfaces live NASA/JPL near-Earth object data across six tabs, with a 3D interactive globe as the centerpiece of the homepage.  
**Audience:** Curious general public — no astronomy background assumed. Every technical term gets a tooltip or inline definition.  
**Deployment target:** GitHub Pages (single HTML file or static build)

---

## Design Language

### Aesthetic Direction
Clean, minimal data journalism — think The Pudding or NYT's data desk. Light background, generous whitespace, crisp sans-serif typography. Color is used *only* to signal meaning, never decoratively.

### Color System
Use CSS variables throughout:

```css
--bg:           #f8f7f4;   /* warm off-white page background */
--surface:      #ffffff;   /* card / panel background */
--border:       #e5e3de;   /* subtle dividers */
--text-primary: #1a1917;   /* headlines, labels */
--text-secondary: #6b6860; /* supporting copy, tooltips */
--accent-blue:  #2563eb;   /* neutral / safe objects, links */
--accent-amber: #d97706;   /* potentially hazardous asteroids */
--accent-red:   #dc2626;   /* Torino 1+ / high risk */
--accent-green: #16a34a;   /* confirmed safe / low risk */
```

### Typography
- **Display / headings:** [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display) — editorial, authoritative
- **Body / data:** [DM Mono](https://fonts.google.com/specimen/DM+Mono) for numeric values; [DM Sans](https://fonts.google.com/specimen/DM+Sans) for labels and prose
- Load all three from Google Fonts

### Layout
- Max content width: `1200px`, centered
- Tab navigation: sticky top bar, minimal underline-style active indicator
- Cards use `border-radius: 4px`, `1px solid var(--border)`, subtle `box-shadow`
- Data tables: zebra striping with `--border`, no heavy grid lines
- Responsive: gracefully degrades to single-column on mobile (globe hidden on small screens)

### Motion
- Tab transitions: 150ms fade
- Table rows: hover highlight with 80ms background transition
- Globe: continuous slow auto-rotation on idle, pauses on interaction
- Stat cards on homepage: staggered fade-in on load (100ms delay between each)

---

## APIs

### 1. NeoWs — NASA Near Earth Object Web Service
- **Base URL:** `https://api.nasa.gov/neo/rest/v1/feed`
- **Auth:** `api_key` query param (use `DEMO_KEY` as fallback, prompt user to add their own)
- **Key params:** `start_date` (YYYY-MM-DD), `end_date` (max 7 days after start)
- **Used in:** Tab 1 (Overview/Globe), Tab 2 (This Week), Tab 5 (Context)
- **Key fields per object:**
  - `name`
  - `estimated_diameter.meters.estimated_diameter_max`
  - `is_potentially_hazardous_asteroid`
  - Per close approach: `close_approach_date`, `miss_distance.kilometers`, `miss_distance.lunar`, `relative_velocity.kilometers_per_hour`

### 2. SBDB Close-Approach Data API — JPL
- **Base URL:** `https://ssd-api.jpl.nasa.gov/cad.api`
- **Auth:** None required
- **Key params:**
  - `date-min` / `date-max` (YYYY-MM-DD or "now")
  - `dist-max` (e.g. `10LD` for 10 lunar distances)
  - `sort` (e.g. `date`, `-dist`)
  - `limit` (number of results)
  - `fullname=true` (include full object name)
- **Used in:** Tab 3 (Future Approaches), Tab 6 (History)
- **Key response fields** (array of arrays, headers in `fields` key):
  - `des` — designation
  - `cd` — close-approach date
  - `dist` — nominal miss distance (AU)
  - `dist_min` / `dist_max` — uncertainty range
  - `v_rel` — relative velocity (km/s)
  - `h` — absolute magnitude (proxy for size)

### 3. Sentry — Impact Monitoring System — JPL CNEOS
- **Base URL:** `https://ssd-api.jpl.nasa.gov/sentry.api`
- **Auth:** None required
- **Key params:**
  - No params needed for full list; add `des=<name>` for single object detail
  - `ps-min` to filter by minimum Palermo scale value
- **Used in:** Tab 4 (Risk Watch)
- **Key response fields** (inside `data` array):
  - `des` — designation
  - `fullname` — full name
  - `diameter` — estimated diameter (km)
  - `ps_cum` — cumulative Palermo scale
  - `ts_max` — maximum Torino scale
  - `ip` — impact probability (string, e.g. "1.4e-04")
  - `v_inf` — velocity at infinity (km/s)
  - `last_obs` — date of last observation

---

## Tab Structure

### Tab 0 — Overview (Homepage / Default)

**Purpose:** Immediate visual impact. The user lands here and understands at a glance what's happening in near-Earth space this week.

**Layout:**
- Top: three headline stat cards in a row
  - 🪐 **Closest approach this week** — object name, miss distance in LD and km, date
  - 📏 **Largest object this week** — object name, estimated diameter in meters
  - ⚡ **Fastest flyby this week** — object name, velocity in km/h and km/s
- Below: 3D globe (full width, ~500px tall)
  - Asteroid markers positioned at scaled miss distances from Earth center
  - Moon shown as a labeled reference ring at 1 LD
  - Potentially hazardous asteroids: amber markers; others: blue markers
  - Clicking a marker shows a tooltip: name, date, miss distance, hazard status
  - Slow auto-rotation; drag to spin, scroll to zoom
  - Legend: amber = potentially hazardous, blue = routine flyby
- Below globe: small note — "Showing close approaches for [date range]. [N] objects tracked."

**Data source:** NeoWs (current week)

**Globe implementation:** [globe.gl](https://globe.gl/) via CDN  
- Miss distance mapping: use a logarithmic scale so objects from 0.1 LD to 10 LD are all visually distinguishable
- Earth texture: use globe.gl's default or a simple blue marble image URL
- Asteroid altitude formula (example starting point): `altitude = Math.log10(distLD + 1) * 1.5`

---

### Tab 1 — This Week

**Purpose:** Full browsable list of this week's flybys with filtering and sorting.

**Layout:**
- Filter bar (above table):
  - Toggle: "Potentially hazardous only"
  - Slider: estimated diameter range (meters)
  - Date picker: select any 7-day window (defaults to current week)
  - Sort dropdown: date, miss distance, size, velocity
- Data table columns:
  | Column | Description |
  |--------|-------------|
  | Name | Asteroid designation, linked to JPL small-body lookup |
  | Date | Close approach date |
  | Miss Distance | Primary: lunar distances (LD); secondary: km in smaller text |
  | Diameter | Estimated max diameter in meters |
  | Velocity | km/h |
  | Hazard | Amber badge "⚠ PHO" or muted "—" |
- Row click → expands inline detail panel:
  - Size comparison mini-visual (see Tab 5 logic)
  - Velocity comparison (vs. speed of sound, bullet, ISS)
  - Link: "View in Risk Watch" (if in Sentry) / "View full history" (SBDB)
- Pagination: 20 rows per page

**Data source:** NeoWs

---

### Tab 2 — Future Approaches

**Purpose:** Look ahead — what's coming in the next 12 months?

**Layout:**
- Controls:
  - Time range selector: Next 3 months / 6 months / 12 months / Custom
  - Max distance filter: 1 LD / 5 LD / 10 LD / Any
  - Min size filter (magnitude proxy): "city-block sized+" / "stadium+" / "all"
- Summary bar: "[N] objects will pass within [X] LD over the next [period]"
- Data table columns:
  | Column | Description |
  |--------|-------------|
  | Designation | Object name/ID |
  | Date | Close approach date |
  | Miss Distance | LD (primary), km (secondary) |
  | Velocity | km/s |
  | H (magnitude) | Absolute magnitude with tooltip explaining size proxy |
  | Uncertainty | dist_min to dist_max range shown as a small range bar |
- Highlight row in amber if object is also in Sentry list
- Empty state: friendly message if no objects match filters

**Data source:** SBDB (`date-min=now`, `date-max=+365d`, `dist-max=10LD`)

---

### Tab 3 — Risk Watch

**Purpose:** Surface Sentry's impact monitoring data in plain language.

**Layout:**
- Intro blurb (2–3 sentences): What is Sentry? What does it mean to be on the list? (All objects here have non-zero but very small probabilities.)
- Scale explainer cards (horizontal row):
  - Torino 0: "No likely consequence" (green)
  - Torino 1: "Merits attention" (amber)
  - Torino 2–4: "Merits concern" (orange)
  - Torino 5–10: "Threatening / certain impact" (red)
- Sort controls: Impact probability / Palermo scale / Torino scale / Diameter / Last observed
- Data table columns:
  | Column | Description |
  |--------|-------------|
  | Name | Full object name |
  | Diameter | km (with tooltip: "uncertainty in size estimate") |
  | Impact Probability | Displayed as "1 in X" format AND as scientific notation |
  | Palermo Scale | Numeric value with color-coded mini bar (negative = good) |
  | Torino Scale | Badge: 0 (gray), 1 (amber), 2+ (red) |
  | Velocity | km/s at impact |
  | Last Observed | Date |
- Row click → detail panel: full name, all impact windows, notes
- Footer note: "Most objects have Torino Scale 0. Inclusion on this list does not imply danger."

**Data source:** Sentry API (full list)

---

### Tab 4 — Context

**Purpose:** Make asteroid data tangible and relatable.

**Layout — two panels side by side (stacked on mobile):**

#### Panel A: Size Comparison
- Dropdown: select any object from this week's NeoWs data
- Visual: horizontal scale bar showing the asteroid's estimated diameter alongside:
  - 🚌 Double-decker bus — 4m
  - 🏈 Football field — 91m
  - 🗼 Eiffel Tower — 300m
  - 🏙️ City block — ~200m
  - ⛰️ Empire State Building — 443m
  - 🌉 Golden Gate Bridge — 2,737m
- Asteroid shown as a labeled bar in amber; reference objects in gray
- Caption: "[Name] is estimated to be [X] meters across — roughly [N]x the size of [closest reference]"

#### Panel B: Speed Comparison
- Same object selector (synced with Panel A)
- Horizontal bar chart (longest = fastest):
  - 🐢 Walking human — 5 km/h
  - 🚗 Highway car — 120 km/h
  - ✈️ Commercial jet — 900 km/h
  - 🔫 Rifle bullet — 3,600 km/h
  - 🚀 ISS — 27,600 km/h
  - ☄️ [Selected asteroid] — [velocity] km/h (amber bar)
  - 💡 Speed of light — shown as reference label off-chart
- Caption: "[Name] is traveling [X] times faster than a commercial jet"

**Data source:** NeoWs (for object selector and velocity/size data)

---

### Tab 5 — History

**Purpose:** Historical context — notable past close approaches and how the field has evolved.

**Layout:**
- Controls: Year range slider (1900–2025), max distance filter
- Pinned milestone events (hardcoded, visually distinct):
  - 1908 — Tunguska Event
  - 2013 — Chelyabinsk meteor
  - 2022 — DART impact
  - 2029 — Apophis flyby (upcoming, marked as future)
- Below milestones: SBDB data table of historical close approaches
- Table columns: Designation, Date, Miss Distance (LD + km), Velocity, H magnitude
- Sort by: date (default), miss distance, size
- Visual treatment: milestone rows use a left accent border in amber; SBDB rows are standard

**Data source:** SBDB (`date-max=now`, `dist-max=10LD`, `sort=-date`, large limit)

---

## Global Features

### API Key Handling
- On first load, check `localStorage` for a saved NASA API key
- If not found, show a dismissible banner: "Using DEMO_KEY (rate limited). [Add your free NASA API key →]" which opens a small modal with an input field
- Save key to `localStorage` on submit; use for all NeoWs requests

### Cross-Tab Linking
- Every asteroid name/designation is clickable anywhere in the app
- Clicking navigates to the relevant tab with that object pre-selected or highlighted
- Use URL hash for tab state: `#this-week`, `#future`, `#risk-watch`, `#context`, `#history`

### Tooltips
Define tooltips for all jargon:
- **Lunar Distance (LD):** ~384,400 km, the average distance from Earth to the Moon
- **Potentially Hazardous Object (PHO):** An asteroid larger than ~140m that passes within 0.05 AU of Earth's orbit
- **Palermo Scale:** A logarithmic measure of impact risk relative to background hazard. Negative values = below background risk.
- **Torino Scale:** A 0–10 public communication scale for impact hazard. 0 = no concern; 10 = certain major impact.
- **Absolute Magnitude (H):** A measure of an object's brightness used to estimate size. Lower H = larger object.

### Loading States
- Each tab shows a skeleton loader (gray animated placeholder bars) while fetching
- Error state: friendly message + retry button if API call fails

### Units Toggle (optional stretch)
- Small toggle in the header: **km / miles** — converts all distance displays site-wide

---

## File Structure

```
index.html          # Single HTML file (preferred) OR
├── index.html
├── style.css
├── app.js
└── README.md
```

Prefer a **single `index.html`** with inline `<style>` and `<script>` blocks for simplest GitHub Pages deployment.

---

## CDN Dependencies

```html
<!-- Globe -->
<script src="https://unpkg.com/globe.gl"></script>

<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

No build step. No npm. No framework required (vanilla JS is fine).

---

## Deployment

1. Push `index.html` to the `main` branch of your repo at `https://github.com/aiml-1870-2026/your-gamertag`
2. Enable GitHub Pages in repo Settings → Pages → Source: `main` / `root`
3. Live URL: `https://aiml-1870-2026.github.io/your-gamertag/`

---

## Out of Scope

- No backend / server required
- No user accounts
- No data persistence beyond the NASA API key in localStorage
- No real-time WebSocket updates (polling on tab switch is sufficient)
