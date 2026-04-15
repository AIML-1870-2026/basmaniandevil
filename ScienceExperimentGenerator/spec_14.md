# Science Experiment Generator — Project Spec

## Project Overview

Build a single-page web app that lets a user input a grade level and available supplies, then calls the OpenAI API to generate a tailored, hands-on science experiment. The response should be rendered as formatted HTML (not raw text).

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
- Anthropic or Google integrations
- Model selection dropdown / provider switching
- Structured output mode and JSON schema handling

This project uses **unstructured (free-form) responses only**. Render the model's markdown output as formatted HTML.

---

## Technical Constraints

- **OpenAI only** — no provider switching. Direct browser-to-API calls work with OpenAI due to CORS policy; Anthropic does not allow this.
- **Single file** — one `index.html` file, ready for GitHub Pages deployment.
- **No backend** — everything runs in the browser.
- **API key** — loaded from a `.env` file, stored in memory only. Never persisted or exposed.
- **Markdown rendering** — use a library like [marked.js](https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js) (available via CDN) to render the LLM's markdown response as HTML.

---

## User Interface

### Inputs

1. **Grade Level** — a dropdown (`<select>`) with the following options:
   - K–2
   - 3–5
   - 6–8
   - 9–12

2. **Available Supplies** — a `<textarea>` where the user types a comma-separated or line-by-line list of materials they have on hand (e.g., "baking soda, vinegar, a plastic bottle, food coloring").

3. **Generate Button** — triggers the API call.

### Output

- A clearly styled results area below the inputs.
- Show a loading indicator while the API call is in progress.
- Render the model's response as formatted HTML (headings, bold text, bullet lists, etc.).
- Display a friendly error message if the API call fails.

---

## LLM Prompt Design

Construct a system prompt and user message that instructs the model to:

- Generate one complete, safe, hands-on science experiment
- Match the complexity and vocabulary to the selected grade level
- Use only the supplies the user listed
- Format the response in markdown with clear sections, for example:
  - **Experiment Title**
  - **Objective**
  - **Materials Needed**
  - **Step-by-Step Instructions**
  - **What's Happening? (The Science)**
  - **Discussion Questions** (optional, for higher grade levels)

Example system prompt to use or adapt:
```
You are a science education expert who designs safe, engaging, hands-on experiments for K-12 students. When given a grade level and a list of available supplies, you generate one complete experiment. Format your response in markdown with clearly labeled sections. Keep language and complexity appropriate for the grade level provided. Only use the materials the user has listed.
```

---

## OpenAI API Call

Use the chat completions endpoint:

```
POST https://api.openai.com/v1/chat/completions
```

Recommended model: `gpt-4o-mini` (fast and cost-effective for this use case).

Request body structure:
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "<system prompt here>" },
    { "role": "user", "content": "Grade level: 3–5\nSupplies: baking soda, vinegar, a jar, food coloring" }
  ]
}
```

Authorization header:
```
Authorization: Bearer <OPENAI_API_KEY>
```

---

## File Structure

```
/
├── index.html       ← entire app lives here (HTML + CSS + JS)
├── .env             ← API key (not committed to Git)
├── .gitignore       ← should include .env
└── temp/            ← reference Switchboard code (do not deploy)
```

---

## .gitignore

Make sure `.gitignore` includes:
```
.env
temp/
```

---

## Definition of Done

- [ ] Grade level dropdown works
- [ ] Supplies textarea accepts free-form input
- [ ] Clicking "Generate" triggers the OpenAI API call
- [ ] A loading state is shown while waiting
- [ ] The response renders as formatted HTML (not raw markdown)
- [ ] Errors are caught and displayed gracefully
- [ ] API key is never hard-coded — loaded from `.env` in memory only
- [ ] App works as a single `index.html` with no build step
- [ ] `.env` and `temp/` are excluded from Git
