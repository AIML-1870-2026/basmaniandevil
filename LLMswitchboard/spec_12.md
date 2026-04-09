# LLM Switchboard — Project Specification

## Overview

Build a single-file `index.html` LLM Switchboard — a professional, dashboard-style web app
that lets a user send prompts to large language models and compare responses side by side.
This is the reference infrastructure for future AI agent projects.

**Deliverable:** One file — `index.html`. All CSS and JS must be inline. No build step, no
external files (CDN imports are fine). Must run by opening the file directly in a browser.

---

## Visual Design

**Aesthetic:** Professional dashboard. Think Vercel, Linear, or Notion — clean flat surfaces,
tight typography, generous whitespace, subtle borders. No gradients, no shadows, no
decorative effects.

**Layout:** Two-column. Fixed sidebar (220px) on the left for all controls. Main content
area on the right for composing and reading responses.

**Typography:** Use a clean sans-serif from Google Fonts (e.g. `DM Sans` or `IBM Plex Sans`).
Monospace font for JSON output and API key fields.

**Colors:**
- Backgrounds: white / off-white surface / light gray page bg
- Borders: very subtle, ~1px, low-opacity
- Accent: a single muted blue for active states, buttons, and links
- Status colors: soft green for success/connected, soft amber for warnings, soft red for errors
- All colors must work in both light and dark mode (use CSS variables)

**Top bar:** 48px height. App name on left. Provider connection status badges on right
(e.g. "OpenAI connected" in green, "Anthropic — CORS" in amber).

---

## Sidebar (left panel, 220px wide)

### Provider
- Two toggle buttons: **OpenAI** | **Anthropic**
- Active provider is visually highlighted

### Model
- Dropdown to select the primary model for the active provider
- OpenAI models: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
- Anthropic models: `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`
  (shown but disabled with a CORS note when Anthropic is selected)

### Compare model (for side-by-side mode)
- Second dropdown, same model list
- Can be set to "None" to disable comparison

### Output mode
- Two-segment toggle: **Unstructured** | **Structured**
- Switching to Structured reveals the Schema Editor tab

### API key
- Text input (masked) for pasting a key
- "Upload .env" button for file upload
  - Parse `.env` format: `OPENAI_API_KEY=sk-...`
  - Parse `.csv` format: first column = key name, second = value
- Keys are stored **in memory only** — never in localStorage, never in cookies
- Display a small privacy note: "Keys are never saved or transmitted beyond the API call"

### Response metrics
- 2×2 grid of metric cards, updated after each response:
  - **Time** — response time in seconds
  - **Tokens** — token count from API response (if available)
  - **Length** — character count of the response
  - **Est. cost** — rough cost estimate based on model pricing
- When in comparison mode, show metrics for both models

---

## Main content area (right panel)

### Tabs
Three tabs at the top of the main area:

1. **Compose** (default)
2. **Schema editor**
3. **Prompt library**

---

### Tab 1: Compose

#### Prompt textarea
- Full-width, resizable textarea
- Placeholder: "Enter your prompt here..."
- Keyboard shortcut: `Cmd+Enter` / `Ctrl+Enter` to submit

#### Example prompt pills
- Row of clickable pills below the textarea that load preset prompts:
  1. "Explain black holes" — general science explanation
  2. "Historical inventions" — list 3 inventions with name, year, inventor, impact
  3. "Summarize a news topic" — ask the model to summarize a topic of its choice
  4. "Write a short poem" — creative writing
  5. "Debug this code" — ask for a generic code debugging tip
- Clicking a pill loads that prompt into the textarea

#### Send button
- Label: **"Send"** (single model) or **"Send to both"** (when compare model is set)
- Muted blue background, right-aligned

#### Response panels
- When no compare model: one full-width response panel
- When compare model is set: two equal-width panels side by side
- Each panel has a header showing:
  - Model name (e.g. `gpt-4o`)
  - Output mode + response time + token count (e.g. `structured · 1.2s · 280 tok`)
- Panel body:
  - **Unstructured mode:** display response as formatted text
  - **Structured mode:** display raw JSON in a monospace block, plus the validator
    report (see Structured Output Validator below)
- Show a loading spinner inside the panel while awaiting response
- Show a clear error message if the request fails (invalid key, rate limit, network, etc.)

#### CORS banner
- When Anthropic is the selected provider, display a non-blocking info banner below
  the response panels:
  > **ℹ Anthropic unavailable in browser.** Anthropic's API doesn't allow direct
  > browser calls due to CORS restrictions. This is a server-side API designed to be
  > called from a backend. To use Claude models, run a local proxy or backend server.
- Style: soft amber background, dark amber text, info icon on the left

---

### Tab 2: Schema editor

Only relevant when output mode is **Structured**.

#### Schema textarea
- Large textarea pre-populated with a default JSON schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "year": { "type": "integer" },
    "inventor": { "type": "string" },
    "impact": { "type": "string" }
  },
  "required": ["name", "year", "inventor", "impact"]
}
```

#### Schema templates (dropdown)
Pre-built schemas the user can load:
- **Invention record** (default above)
- **Book summary** — title, author, genre, one_line_summary, themes (array)
- **Product analysis** — product_name, target_audience, strengths (array), weaknesses (array), price_range
- **Event record** — event_name, date, location, significance, key_figures (array)
- **Custom** — blank schema for the user to write their own

#### How it works (brief explainer)
Small callout box below the editor:
> When structured mode is active, your schema is sent with the prompt. The model formats
> its response to match the shape you define. Your code receives clean, predictable JSON.

---

### Tab 3: Prompt library

A saved collection of prompts the user can load. Prompts are stored **in memory only**
(not persisted across page reloads).

#### Pre-loaded prompts
Start with 5 example prompts already in the library (same as the example pills):
- Each row shows: prompt name, a truncated preview, output mode badge (structured/unstructured)
- Clicking a row loads it into the Compose tab

#### Save current prompt button
- Button at top: **"Save current prompt"**
- Saves whatever is in the textarea + the current output mode + schema (if structured)
- Prompts are named by the user (simple text input on save)

#### Delete prompt
- Small delete button on each row

---

## Stretch features (all required)

### 1. Side-by-side model comparison
- When a second model is selected in the "Compare model" dropdown, both models receive
  the same prompt simultaneously (two parallel API calls)
- Responses render in two panels as described above
- Per-panel metrics in each panel header

### 2. Response metrics
- After every response, update the sidebar metrics: time, tokens, length, estimated cost
- In comparison mode, show metrics for both panels (label each: "Model A" / "Model B")
- Cost estimates (rough):
  - `gpt-4o`: $0.005 / 1K tokens
  - `gpt-4o-mini`: $0.0002 / 1K tokens
  - `gpt-4-turbo`: $0.01 / 1K tokens
  - `gpt-3.5-turbo`: $0.0005 / 1K tokens

### 3. Prompt library
- Described fully in Tab 3 above

### 4. Structured output validator
- After receiving a structured response, parse the JSON and validate it against the
  user's schema
- Show a validator report inside the response panel (below the JSON block):
  - A row for each required field with a green ✓ (present + correct type) or red ✗
    (missing or wrong type)
  - Summary line: e.g. "4 / 5 fields matched"
- If the response is not valid JSON, show a clear error: "Model did not return valid JSON"

---

## API integration

### OpenAI

```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json
```

**Unstructured request body:**
```json
{
  "model": "gpt-4o",
  "messages": [{ "role": "user", "content": "{prompt}" }]
}
```

**Structured request body** (use `response_format` with JSON schema):
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "Respond only with valid JSON matching this schema: {schema}"
    },
    { "role": "user", "content": "{prompt}" }
  ],
  "response_format": { "type": "json_object" }
}
```

Parse response from: `data.choices[0].message.content`
Token count from: `data.usage.completion_tokens`

### Anthropic

Anthropic's API cannot be called directly from the browser due to CORS. Do not attempt
the call — instead, detect that Anthropic is selected and show the CORS banner immediately.
The model dropdowns for Anthropic should be visible but the send button should be disabled
with a tooltip explaining why.

---

## Error handling

| Scenario | Behavior |
|---|---|
| No API key entered | Disable send button, show inline hint "Add an API key to get started" |
| Invalid API key (401) | Show error in response panel: "Invalid API key. Check your key and try again." |
| Rate limit (429) | Show error: "Rate limit reached. Wait a moment and try again." |
| Network failure | Show error: "Request failed. Check your internet connection." |
| Model returns invalid JSON (structured mode) | Show error in validator: "Model did not return valid JSON" |
| Anthropic selected | Show CORS banner, disable send button |

---

## Technical notes

- **Single file:** Everything in `index.html`. Inline `<style>` and `<script>` tags.
- **No frameworks:** Plain HTML, CSS, and vanilla JavaScript only.
- **CDN allowed:** Google Fonts is fine. No jQuery, no React.
- **No persistence:** Never use `localStorage`, `sessionStorage`, or cookies for API keys
  or user data. All state lives in JS variables.
- **Parallel requests:** Use `Promise.all()` for side-by-side comparison calls.
- **Responsive:** The layout should work reasonably at 1024px+ wide. No need for mobile
  support, but don't break below 1200px.
- **Accessibility:** Use semantic HTML. Labels on all form elements. Focus states on
  interactive elements.

---

## File structure

```
index.html        ← the entire app, single file
```

---

## Acceptance criteria

- [ ] Provider toggle switches between OpenAI and Anthropic
- [ ] Model dropdown updates based on selected provider
- [ ] API key can be entered manually or uploaded via .env / .csv file
- [ ] Unstructured mode sends prompt and displays response text
- [ ] Structured mode sends prompt with schema and displays JSON response
- [ ] Schema editor tab lets user edit or choose from template schemas
- [ ] Structured output validator shows field-level pass/fail report
- [ ] Side-by-side comparison sends same prompt to two models in parallel
- [ ] Response metrics (time, tokens, length, cost) update after each response
- [ ] Prompt library allows saving, loading, and deleting prompts (in-memory)
- [ ] Example prompt pills load preset prompts into textarea
- [ ] CORS banner appears when Anthropic is selected
- [ ] All error states are handled gracefully with clear messages
- [ ] No API keys are persisted anywhere
- [ ] App works by opening `index.html` directly in a browser
