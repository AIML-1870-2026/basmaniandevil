# Blackjack AI Agent — Claude Code Build Instructions

## Project Overview

Build a **static webpage** (single HTML file with embedded CSS and JavaScript) that implements a fully functional Blackjack game powered by an AI agent. The agent reads the current game state and calls an LLM to recommend the next move.

---

## Reference Implementation

The `temp/` folder contains a working example of a static webpage that interacts with an LLM via an uploaded `.env` file. Use it as a reference for:

- How to parse a `.env` file for the API key (in-memory only, never stored or transmitted beyond the API call)
- The `fetch()` call structure for the Anthropic API
- Error handling patterns for failed API requests

> **Do NOT include the `temp/` folder in the final build or deployment.**

---

## Core Requirements

### 1. API Key Handling
- Accept an Anthropic API key via `.env` file upload
- Parse the file in-memory only — never store, log, or transmit the key beyond the API call
- Display a clear upload prompt before the game begins
- Show a confirmation once the key is loaded successfully

### 2. Blackjack Game Logic
Implement a complete, rules-correct Blackjack game:
- Standard 52-card deck (shuffle between hands)
- Correct hand scoring including Ace as 1 or 11
- Dealer must hit on soft 16 or less, stand on soft 17 or more
- Detect and handle: Blackjack (natural 21), bust, push (tie)
- Track the player's **balance** across hands (starting balance: $1,000; default bet: $100)
- Update balance correctly on win (+bet), loss (-bet), push (no change), and Blackjack (+1.5× bet)

### 3. AI Agent Integration
- After the initial deal, send the current game state to the LLM
- Game state passed to the LLM should include:
  - Player's cards and total
  - Dealer's face-up card
  - Whether the player can double down or split (if applicable)
- The LLM must return a **structured JSON response** to avoid keyword-search ambiguity

#### Required JSON response format:
```json
{
  "action": "hit" | "stand" | "double",
  "reasoning": "Brief explanation of the recommendation",
  "confidence": "high" | "medium" | "low"
}
```

- Parse `action` from the JSON directly — do not use keyword search on free text
- Display the `reasoning` to the user as the "AI Analysis"
- Add an **Execute Recommendation** button that performs the recommended action

### 4. Console Logging (Debugging)
Log the following to the browser console for transparency:
- The full prompt sent to the LLM
- The raw API response received
- The parsed JSON action extracted
- Any errors encountered during the API call

---

## UI Layout

Structure the page with these sections:

```
[ Header: "Blackjack AI Agent" ]

[ API Key Upload (shown until key is loaded) ]

[ Game Table ]
  - Dealer's hand (one card face down until reveal)
  - Player's hand
  - Card totals

[ AI Analysis Panel ]
  - Reasoning from LLM
  - Confidence level
  - Recommended action (highlighted)
  - [ Execute Recommendation ] button

[ Player Controls ]
  - [ Hit ] [ Stand ] [ New Hand ]

[ Balance Display ]
  - Current balance
  - Current bet
```

---

## Stretch Challenges (Implement at least 2)

### Option A — Strategy Visualization
Display a Basic Strategy decision matrix alongside the AI recommendation. Highlight the cell corresponding to the current player total vs. dealer up card. Show whether the AI agrees with Basic Strategy.

### Option B — Performance Analytics
Track and display running statistics across all hands played:
- Win / Loss / Push counts and percentages
- Bankroll chart (balance over time, rendered as a simple line graph)
- Decision accuracy (how often AI matched Basic Strategy)

### Option C — Explainability Controls
Add a toggle for explanation detail level:
- **Simple:** Just the action ("Stand")
- **Standard:** One-sentence reason
- **Detailed:** Full statistical reasoning including bust probabilities and expected value

### Option D — Risk Tolerance Settings
Allow the user to set a risk profile (Conservative / Balanced / Aggressive) before each hand. Pass this as context to the LLM and show how the recommendation changes between profiles.

---

## Technical Constraints

- **Single static file** — all HTML, CSS, and JS in one `index.html`
- No backend, no build step, no frameworks — plain HTML/CSS/JS only
- No external dependencies except the Anthropic API
- Must run correctly when opened directly in a browser (file://) or served statically
- API key must never appear in the DOM, localStorage, or any log output

---

## LLM API Call Structure

Use the Anthropic Messages API:

```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: <key from .env>
  anthropic-version: 2023-06-01
  content-type: application/json

Body:
  model: claude-sonnet-4-20250514
  max_tokens: 300
  messages: [{ role: "user", content: "<game state prompt>" }]
```

Instruct the model in the prompt to respond **only** with valid JSON matching the schema above — no preamble, no markdown fences.

---

## Acceptance Checklist

Before considering the project complete, verify each item:

- [ ] `.env` file upload works and key is parsed correctly
- [ ] A full hand can be played from deal to resolution
- [ ] Balance updates correctly for win, loss, push, and Blackjack
- [ ] AI recommendation is fetched and displayed after every deal
- [ ] Execute Recommendation button performs the correct action
- [ ] JSON parsing works reliably — no keyword search on LLM text
- [ ] Console logs show prompt, raw response, and parsed action
- [ ] At least 2 stretch challenges are implemented and functional
- [ ] Page works as a single static file with no build step
