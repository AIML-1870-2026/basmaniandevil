# Product Review Generator — Project Spec

## Overview

Build a single-page web application that allows a user to generate product reviews using OpenAI's API. The user provides product details and preferences, and the LLM returns a formatted review rendered as HTML.

This is a browser-based, single-file application deployed via GitHub Pages. There is no backend server.

---

## Reference Implementation

The `temp/` folder contains my complete LLM Switchboard project (HTML, CSS, and JS files). This is **NOT** part of the current project — do not include it in the final build or deployment.

Use it as a reference for:
- How to parse a `.env` file for API keys (in-memory only)
- The `fetch()` call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- How the code is organized across separate files
- The general approach to building a single-page LLM tool

Ignore these Switchboard features (not needed here):
- Anthropic integration (this project is OpenAI-only)
- The model selection dropdown / provider switching
- Structured output mode and JSON schema handling

This project uses unstructured (free-form) responses only. Render the model's markdown output as formatted HTML.

---

## Technical Constraints

- **OpenAI models only** — no Anthropic dropdown, no provider switching
- **Unstructured responses** — the model returns free-form text, not JSON; no schema templates needed
- **Markdown rendering** — render the model's response as properly formatted HTML (bold, lists, headings, etc.), not raw text. Use a library like `marked.js` (available via CDN) for this.
- **API keys loaded from `.env`** — same in-memory-only pattern as the Switchboard; nothing stored, nothing persisted
- **Single-file deployment** — one `index.html` file, ready for GitHub Pages

---

## User Interface

### Inputs

The user should be able to provide the following before generating a review:

| Field | Type | Description |
|---|---|---|
| Product Name | Text input | Name of the product being reviewed |
| Product Category | Dropdown or text input | e.g. Electronics, Clothing, Kitchen, etc. |
| Key Features | Textarea | Brief bullet points or description of the product's main features |
| Sentiment | Dropdown | Choose tone: Positive, Negative, Mixed/Balanced |
| Review Length | Dropdown | Short (1–2 paragraphs), Medium (3–4 paragraphs), Long (5+ paragraphs) |
| Model Selection | Dropdown | Let the user choose from a set of OpenAI models (e.g. gpt-4o, gpt-4o-mini, gpt-3.5-turbo) |

### Output

- Display the generated review in a styled output area below the form
- Render markdown as formatted HTML (not raw text)
- Show a loading indicator while the request is in flight
- Display a clear error message if the API call fails

---

## Prompt Construction

Build the system and user prompts dynamically from the form inputs. Example approach:

**System prompt:**
> You are an expert product reviewer. Write realistic, helpful, and detailed product reviews based on the information provided. Format your response using markdown with headings, bullet points, and emphasis where appropriate.

**User prompt (constructed from inputs):**
> Write a [length] [sentiment] review for the following product:
> - Product Name: [name]
> - Category: [category]
> - Key Features: [features]

---

## API Integration

- Follow the same `fetch()` pattern used in the Switchboard for OpenAI's `/v1/chat/completions` endpoint
- Load the API key from `.env` using the same in-memory parsing approach as the Switchboard
- Use the model selected by the user in the dropdown
- Handle errors gracefully: show a user-friendly message if the request fails (e.g. invalid key, network error, rate limit)

---

## File Structure

```
/
├── index.html       # Single deployable file (HTML + CSS + JS inline or linked)
├── .env             # API key (gitignored)
├── .gitignore       # Must exclude .env
└── temp/            # Reference implementation only — do not deploy
```

> If CSS and JS are separated into their own files, that is fine — just ensure `index.html` is the entry point and the app works when opened directly in a browser or served via GitHub Pages.

---

## Out of Scope

- No backend / Node.js server required
- No database or persistent storage
- No user accounts or authentication
- No Anthropic or other non-OpenAI providers
- No structured JSON output or schema validation
- Do not deploy or include anything from the `temp/` folder

---

## Done When...

- [ ] User can fill out the form and click a "Generate Review" button
- [ ] App calls the selected OpenAI model with a well-constructed prompt
- [ ] Response is rendered as formatted HTML (markdown parsed)
- [ ] Loading state is shown during the API call
- [ ] Errors are displayed clearly if the request fails
- [ ] API key is loaded from `.env` and never hardcoded
- [ ] App works as a single `index.html` on GitHub Pages
- [ ] `.env` is listed in `.gitignore`
