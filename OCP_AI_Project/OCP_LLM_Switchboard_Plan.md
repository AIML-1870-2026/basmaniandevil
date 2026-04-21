# OCP Show Matchmaker — Project Plan
### LLM Switchboard for the Omaha Community Playhouse

---

## Project Overview

An AI-powered web experience that lives on (or alongside) the OCP website. A user answers a short set of questions about themselves, then has a brief conversation with an AI assistant that matches them to the best current OCP show — complete with full show details, ticket purchasing info, and a comparison to other productions currently running.

---

## Visual Design Direction

Mirror the OCP brand as closely as possible so the tool feels like a native part of their website.

### OCP Brand Reference
- **Primary colors**: Deep black/charcoal backgrounds, white text, gold/amber accent tones (from their logo and headers)
- **Typography**: Serif display font for show titles (matches OCP's editorial style), clean sans-serif for body
- **Logo**: `OCP_Logo_new.svg` — white on dark background
- **Navigation style**: Minimal top nav with uppercase link labels
- **Imagery**: Large, cinematic key art per show (pulled live from OCP)
- **Tone**: Theatrical, sophisticated, community-warmth — "Extraordinary Theatre, Crafted Here"

### Implementation Notes
- Use CSS variables to mirror OCP color palette
- Match OCP's card layout style for show result display
- Footer should mirror OCP's footer structure (address, hours, newsletter CTA)
- Optional: embed OCP's actual logo SVG via public URL

---

## Site Architecture

```
/                        → Landing page with hero + "Find My Show" CTA
/match                   → The matchmaking flow (form + chat)
/result                  → Show result card with full details + comparison
```

---

## Feature Breakdown

---

### Feature 1 — User Interest Form (Step 1 of Flow)

A structured form that collects just enough info to power a strong AI recommendation. Keep it short (5–7 questions max) so users don't drop off.

**Form Fields:**
| Field | Type | Options / Notes |
|---|---|---|
| Who are you bringing? | Single select | Just me, Date night, Family with kids, Friend group, Corporate outing |
| What mood are you in? | Single select | Thrilled & on-edge, Laugh-out-loud fun, Emotionally moved, Something classic, Surprise me |
| Genre preference | Multi-select | Musical, Mystery/Thriller, Drama, Comedy, Family-friendly |
| Age range of your group | Single select | All adults, Mix of adults & kids, Mostly kids |
| Availability | Multi-select | Weeknight, Weekend evening, Weekend matinee |
| Budget sensitivity | Single select | Value-conscious, No preference, Special occasion splurge |
| Comfort with mature themes | Single select | Family-safe only, Mild adult content OK, No preference |

**UX Notes:**
- Large, tappable button-style answers (not dropdowns)
- Progress bar or step indicator
- Animated transitions between questions
- OCP branding throughout (colors, logo in header)

---

### Feature 2 — AI Conversation Layer (Step 2 of Flow)

After the form, the user enters a brief chat with the AI to refine the match or ask follow-up questions before the final recommendation is generated.

**Example Flow:**
> AI: "Based on your answers, you're in the mood for a suspenseful night out with your partner. Before I make my recommendation — have you seen any mystery shows recently that you loved or didn't enjoy?"

**Chat Capabilities:**
- Refine the match based on follow-up answers
- Accept free-text input ("I loved Agatha Christie stuff")
- Detect if user wants to skip directly to recommendation
- Gracefully handle off-topic questions ("Just tell me about your shows!")

**Technical Implementation:**
- Claude or OpenAI API (single API key)
- System prompt includes: all current OCP show data scraped at session start, user's form answers, instructions to recommend exactly one primary show + briefly compare all others
- Conversation history maintained in session for multi-turn dialogue

---

### Feature 3 — Live OCP Data Scraper

Pulls live show data from `omahaplayhouse.com` at the time of the user's session so recommendations are always current.

**Data to Scrape Per Show:**
- Show title
- Show dates (start and end)
- Theatre venue (Hawks Mainstage vs. Howard Drew Theatre)
- Show overview / description
- Content advisory (e.g., "Contains mild adult content")
- Ticket purchase URL (links to ticketomaha.com)
- Key art image URL
- Special events tied to the show (e.g., Stage & Story discussions, Audio Described performances, Relaxed performances)
- Accessibility features

**Scraping Strategy:**
- Fetch `omahaplayhouse.com/productions/` to get the list of all current shows
- For each show, fetch the individual show page to get full details
- Parse and structure the data into a clean JSON object
- Inject this JSON into the AI system prompt before the conversation begins

**Current Shows (as of April 2026):**
1. *Dial "M" for Murder* — April 17–May 10, 2026 (Hawks Mainstage)
2. *The Weisenheimers* — April 25, 2026 (special event)
3. *Cameron Mackintosh and Disney's Mary Poppins* — May 29–June 28, 2026 (Hawks Mainstage)
4. *Disney's Newsies Jr.* — June 26–28, 2026

---

### Feature 4 — AI Match Result Card

After the conversation, the AI delivers its recommendation as a rich, visually designed result card — not a plain text message.

**Result Card Contents:**

#### Primary Recommendation Block
- Show key art (full-width hero image)
- Show title + date range
- Theatre name + address (6915 Cass St., Omaha, NE 68132)
- Why it's your match (AI-generated, personalized 2–3 sentence explanation)
- Show overview (pulled from OCP)
- Content advisory
- Accessibility features for this show (audio described, relaxed performance, etc.)
- Special events tied to this show

#### Ticket Info Block
- Direct "Buy Tickets" CTA button → links to ticketomaha.com
- Box office phone number: (402) 553-0800
- Box office hours
- Note for Season Ticket Holders ("Call to reserve: 402-553-0800")
- Seating chart link
- Arrive at least 15 minutes before the show

#### What to Expect Block
- Venue description (Hawks Mainstage = 560-seat proscenium; Howard Drew = 200-seat black box)
- Show length / intermission info (if available)
- Parking info (free onsite parking with season tickets; general info)
- Food & drink at the theatre
- Dress code / vibe (community theatre, but high-caliber production values)

#### Compare the Other Shows Block
- Side-by-side or stacked cards for remaining current shows
- Each card: title, one-line AI summary, key difference from the recommended show
- Example: "If you're in the mood for something lighter and more family-friendly, *Mary Poppins* might be a better fit."

---

### Feature 5 — Ticket Purchase CTA

Every result view ends with a prominent, styled call-to-action.

- Primary button: **"Buy Tickets for [Show Name]"** → opens ticketomaha.com in new tab
- Secondary button: **"See All Shows at OCP"** → opens omahaplayhouse.com/productions/
- Tertiary link: **"Start Over"** → resets the matchmaking flow
- Optional: **"Get Season Tickets"** → omahaplayhouse.com/buy-tickets/season-tickets/

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React (single `.jsx` file for demo) or plain HTML/CSS/JS |
| AI Backend | Claude API (`claude-sonnet-4-20250514`) or OpenAI API |
| Web Scraping | `fetch()` calls to OCP pages at session start + HTML parsing |
| Hosting | GitHub Pages, Vercel, or Netlify (static site) |
| API Key Handling | Environment variable (`.env`) — never hardcoded |

---

## AI System Prompt Strategy

The system prompt sent to the LLM should include:

```
You are a friendly and knowledgeable show recommender for the Omaha Community Playhouse (OCP),
the largest community theatre in the United States, located at 6915 Cass St., Omaha, NE.

Your job is to match the user to the single best show currently playing at OCP based on their
preferences. You will also briefly compare all other current shows so the user can make an
informed decision.

Here is the current show data scraped from omahaplayhouse.com:
[INJECTED JSON SHOW DATA]

Here are the user's form answers:
[INJECTED FORM DATA]

Guidelines:
- Be warm, enthusiastic, and knowledgeable about live theatre
- Ask 1–2 follow-up questions before making your recommendation
- When you make your recommendation, include: why it's the right match, what to expect,
  how to get tickets, and how it compares to other current shows
- Always include the ticket purchase link and box office number (402-553-0800) in your answer
- If the user asks about anything unrelated to OCP shows, gently redirect them
```

---

## User Flow Diagram

```
[Landing Page]
      ↓
[Interest Form — 5–7 button-style questions]
      ↓
[AI Chat — 1–2 follow-up questions]
      ↓
[Result Card — Match + Details + Compare + Buy Tickets CTA]
      ↓
[ticketomaha.com] (external, new tab)
```

---

## Stretch Features (If Time Allows)

- **Accessibility filter**: Let users indicate if they need an audio-described or relaxed performance — AI only recommends shows with those options available
- **Share your match**: Generate a shareable link or screenshot of the result card
- **Email my result**: Simple form to email the result card to yourself
- **Group mode**: Input multiple people's preferences, AI finds the best show for the whole group

---

## Demo Script (For Presentation)

1. Open the landing page — OCP-branded hero with "Find My Perfect Show" button
2. Walk through the interest form (click through a sample user: "Date night, want to be on the edge of my seat, adults only, weekend evening")
3. Show the AI chat exchange (1–2 turns)
4. Display the result card: *Dial "M" for Murder* — show art, overview, ticket link, comparison cards
5. Click "Buy Tickets" to show the handoff to ticketomaha.com
6. Highlight the live data angle: "This pulls directly from OCP's website every session — if they add a new show tomorrow, it shows up automatically"

---

## Key URLs for Development

| Resource | URL |
|---|---|
| OCP Homepage | https://omahaplayhouse.com/ |
| Productions List | https://omahaplayhouse.com/productions/ |
| Buy Tickets | https://omahaplayhouse.com/buy-tickets/on-sale-now/ |
| Ticket Omaha | https://ticketomaha.com/ |
| Seating Chart | https://omahaplayhouse.com/buy-tickets/seating-chart/ |
| Accessibility Info | https://omahaplayhouse.com/inclusion/accessibility/ |
| Box Office Info | https://omahaplayhouse.com/plan-your-visit/box-office/ |
| Parking Info | https://omahaplayhouse.com/plan-your-visit/getting-here-parking/ |

---

*Last updated: April 2026 | Project for Omaha Community Playhouse*
