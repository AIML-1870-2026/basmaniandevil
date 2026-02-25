# Claude Code Prompt: Noir Blackjack Game

## Project Summary

Build a fully playable, browser-based Blackjack game split across **three files**:

- `index.html` — structure and markup
- `styles.css` — all visual styling and animations
- `game.ts` — all game logic and DOM interaction (TypeScript, compiled to `game.js`)

The aesthetic is **noir casino** — dark, moody, cinematic. Think rain-slicked streets, cigarette smoke, velvet and brass, low light. This is not a flashy Las Vegas casino; it's a private backroom game where everyone is beautifully dressed and no one is entirely honest.

> **Note for Claude Code:** After writing the TypeScript file, compile it with `tsc game.ts --target ES2020 --strict` and make sure `index.html` references the compiled `game.js`.

---

## File Structure

```
/blackjack
  index.html
  styles.css
  game.ts         ← TypeScript source
  game.js         ← compiled output (referenced by HTML)
```

---

## Aesthetic & Visual Design

### Color Palette (use as CSS variables)

```css
--bg-deep:        #0a0a0f;      /* near-black background */
--bg-table:       #0d1f12;      /* dark forest green felt */
--bg-card:        #f5f0e8;      /* aged ivory card face */
--felt-texture:   repeating subtle noise or grain overlay on table */
--gold:           #c9a84c;      /* muted antique gold for accents */
--gold-light:     #e8c97a;      /* highlight gold */
--red-suit:       #8b1a1a;      /* deep crimson for hearts/diamonds */
--text-primary:   #e8dcc8;      /* warm off-white */
--text-dim:       #7a6f5e;      /* muted parchment for secondary text */
--shadow-heavy:   rgba(0,0,0,0.85);
--chip-green:     #2e5e3e;
--chip-red:       #7a1f1f;
--chip-black:     #1a1a1a;
--chip-blue:      #1a2a4a;
```

### Typography

Use Google Fonts (load in `index.html` `<head>`):

- **Display / headings:** `Playfair Display` (serif, cinematic elegance)
- **Body / UI labels:** `Josefin Sans` (geometric, clean, slightly cold)
- **Card values:** `Playfair Display` (bold, dramatic)

### Layout

- Full viewport dark background with a subtle grain/noise texture overlay (CSS `background-image` using SVG or pseudo-element)
- A centered, rounded **felt table surface** taking up most of the screen
- **Dealer area** at the top of the table, **player area** at the bottom
- Between them: a thin gold decorative divider line
- **HUD bar** at the very top of the screen: game title on the left, balance on the right — both in `Playfair Display`
- **Betting/action controls** in a panel below the player's cards
- Subtle vignette effect on the page edges (dark radial gradient overlay)
- Atmospheric: consider a faint background image or CSS pattern suggesting wallpaper or wood paneling behind the felt

### Card Design

Cards should look like physical playing cards with personality:

- White/ivory card face (`--bg-card`) with rounded corners (`border-radius: 8px`)
- Colored suit symbols using Unicode: ♠ ♣ ♥ ♦
- Spades/clubs in near-black (`#1a1a1a`), hearts/diamonds in deep red (`--red-suit`)
- Card back: dark navy or black with a geometric diamond pattern in gold lines — use CSS `repeating-linear-gradient` or an SVG background
- Cards have a drop shadow to suggest physical depth
- **Held/dealt cards** appear slightly fanned or offset for visual richness

### Chip Design

Render betting chips as CSS circles with:
- Dashed or notched border (CSS `border` or `outline`)
- Dollar value centered in `Josefin Sans`
- Colors by denomination: $5 = red, $10 = blue, $25 = green, $50 = black, $100 = gold
- Subtle inner shadow and gloss highlight to look 3D

---

## Animations (CSS + TypeScript triggers)

All animations should feel weighty and cinematic — not bouncy or cartoonish.

### Card Flip Animation

When a dealer's hole card is revealed:

```css
/* 3D flip on the Y axis */
.card {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.card.face-down  { transform: rotateY(180deg); }
.card.face-up    { transform: rotateY(0deg); }

.card-front, .card-back {
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
}
.card-back  { transform: rotateY(180deg); }
```

TypeScript should toggle the `.face-down` / `.face-up` class to trigger the flip.

### Card Deal Animation

When cards are dealt, each card should slide in from off-screen (dealer area) and land in position with a slight ease-out. Stagger cards using `animation-delay`.

```css
@keyframes dealCard {
  from {
    opacity: 0;
    transform: translateY(-80px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.card.dealing {
  animation: dealCard 0.4s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
}
```

### Win/Loss/Push Feedback

- **Win:** A soft golden glow pulses around the player's card area (`box-shadow` animation in gold)
- **Bust:** Cards shake slightly and a red vignette briefly flashes at screen edges
- **Push:** A subtle silver shimmer
- **Blackjack:** A more dramatic gold flash with a brief message overlay

### Chip Selection

Chips "lift" with a scale + shadow on hover, and "press" with a slight scale-down on click.

### Balance Update

The balance number briefly scales up and fades when it changes (win/loss flash).

---

## HTML Structure (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blackjack</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <!-- Google Fonts: Playfair Display, Josefin Sans -->
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <!-- Grain/noise overlay -->
  <div class="grain-overlay"></div>

  <!-- Top HUD -->
  <header class="hud">
    <h1 class="game-title">Blackjack</h1>
    <div class="balance-display">
      Balance: <span id="balance">$1000</span>
    </div>
  </header>

  <!-- Main table -->
  <main class="table">

    <!-- Dealer zone -->
    <section class="dealer-zone" id="dealer-zone">
      <div class="zone-label">Dealer</div>
      <div class="hand" id="dealer-hand"></div>
      <div class="hand-value" id="dealer-value"></div>
    </section>

    <!-- Gold divider -->
    <div class="table-divider"></div>

    <!-- Player zone(s) — supports split hands -->
    <section class="player-zone" id="player-zone">
      <div class="zone-label">Player</div>
      <!-- Hands rendered dynamically by TypeScript -->
      <div class="hands-container" id="hands-container"></div>
      <div class="hand-value" id="player-value"></div>
    </section>

  </main>

  <!-- Betting panel (shown before deal) -->
  <div class="panel betting-panel" id="betting-panel">
    <div class="bet-display">Bet: <span id="current-bet">$0</span></div>
    <div class="chips" id="chip-tray">
      <!-- Chips rendered by TypeScript -->
    </div>
    <div class="bet-actions">
      <button id="btn-clear-bet">Clear</button>
      <button id="btn-deal" disabled>Deal</button>
    </div>
  </div>

  <!-- Action panel (shown during play) -->
  <div class="panel action-panel hidden" id="action-panel">
    <button id="btn-hit">Hit</button>
    <button id="btn-stand">Stand</button>
    <button id="btn-double">Double Down</button>
    <button id="btn-split" disabled>Split</button>
  </div>

  <!-- Result overlay -->
  <div class="result-overlay hidden" id="result-overlay">
    <div class="result-message" id="result-message"></div>
    <button id="btn-next-round">Play Again</button>
  </div>

  <!-- Message toast (for mid-game messages) -->
  <div class="toast hidden" id="toast"></div>

  <script src="game.js"></script>
</body>
</html>
```

---

## TypeScript Game Logic (`game.ts`)

### Types

```typescript
type Suit = 'spades' | 'clubs' | 'hearts' | 'diamonds';
type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';

interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

interface Hand {
  cards: Card[];
  bet: number;
  isActive: boolean;       // currently the player's active hand (for splits)
  hasStood: boolean;
  hasDoubled: boolean;
  isSplit: boolean;
  id: string;              // unique DOM id for this hand element
}

type GamePhase = 'betting' | 'player-turn' | 'dealer-turn' | 'round-over';
```

### Game State

```typescript
interface GameState {
  deck: Card[];
  playerHands: Hand[];        // supports 1 or 2 hands (post-split)
  activeHandIndex: number;    // which hand is currently being played
  dealerHand: Hand;
  balance: number;
  currentBet: number;         // bet being built in the betting phase
  phase: GamePhase;
}
```

### Core Requirements

#### Deck & Shuffle
- Build a standard 52-card deck on game start and reshuffle when fewer than 15 cards remain
- Use the **Fisher-Yates shuffle**

#### Dealing
- Deal in proper order: player card 1 → dealer card 1 → player card 2 → dealer card 2
- Dealer's second card is dealt face-down
- Stagger `dealCard` animation by 150ms per card

#### Hand Value Calculation
- Sum all card values
- Aces start as 11; if total > 21 and there are aces counted as 11, reduce by 10 (one at a time) until ≤ 21 or no more aces can be reduced
- Return both the numeric value and whether the hand is "soft" (contains an ace counted as 11)
- Show "soft" values in the UI (e.g., "Soft 17")

#### Blackjack Detection
- Check immediately after initial deal
- Player blackjack with no dealer blackjack → player wins 3:2 payout, round ends
- Both blackjack → push
- Dealer blackjack only → dealer wins

#### Player Actions

**Hit:**
- Deal one card to active hand
- Recalculate value
- If bust (> 21): mark hand as over, move to next hand or dealer turn

**Stand:**
- Mark hand as stood
- Move to next active hand, or begin dealer turn if no more hands

**Double Down:**
- Only allowed on first action of a hand (2 cards, not a split ace)
- Deduct additional bet equal to original bet from balance
- Deal exactly one card, then stand automatically

**Split:**
- Only allowed when both initial cards have the same value (10-value cards match each other regardless of rank — e.g., K and Q can be split)
- Only one split allowed (max 2 hands total)
- Deduct a new bet equal to the original from balance
- Create two new `Hand` objects, one card each
- Deal a second card to each new hand
- Special rule: **split aces** get only one additional card each and cannot hit further
- Disable the Split button after one split

#### Dealer Turn
- Reveal hole card with flip animation
- Dealer hits on < 17, stands on soft 17 or higher
- Add 400ms delay between each dealer card for dramatic effect

#### Payouts
- Blackjack: bet × 2.5 (returns bet + 1.5× winnings)
- Win: bet × 2 (returns bet + winnings)
- Push: returns original bet
- Loss: bet is lost
- For split hands: evaluate each hand independently against the dealer

#### Balance & Betting
- Starting balance: $1,000
- Chip denominations: $5, $10, $25, $50, $100
- Clicking a chip adds its value to `currentBet` (up to current balance)
- "Clear" resets `currentBet` to 0 and returns to balance
- "Deal" is disabled if `currentBet === 0` or `currentBet > balance`
- If balance reaches $0 and no bet is placed, show a "Game Over" screen with a "Restart" button that resets balance to $1,000

#### DOM Rendering
- `renderHand(hand: Hand, container: HTMLElement)`: clears and re-renders all cards in a hand
- `renderCard(card: Card): HTMLElement`: creates a card DOM element with front/back faces
- `renderChips()`: populates the chip tray with clickable chip elements
- `updateHUD()`: updates balance and current bet display
- `showResult(message: string, type: 'win'|'lose'|'push'|'blackjack')`: shows the result overlay with appropriate class for styling
- `showToast(message: string)`: briefly shows a mid-game toast (e.g. "Bust!", "Dealer Busts!")
- `setPhase(phase: GamePhase)`: toggles visibility of betting panel / action panel / result overlay

---

## CSS Details (`styles.css`)

### Key Sections to Implement

1. **Reset & base styles** — box-sizing, margin/padding reset, font defaults
2. **CSS variables** — all colors, spacing, and timing as custom properties
3. **Body & background** — deep background color + grain overlay pseudo-element
4. **HUD** — fixed top bar, flexbox space-between, border-bottom in gold
5. **Table** — centered, rounded, felt green background, subtle inner shadow, max-width ~900px
6. **Dealer/Player zones** — padding, zone labels in `Josefin Sans` uppercase tracking
7. **Divider** — thin horizontal line in gold with slight glow (`box-shadow`)
8. **Card styles:**
   - `.card` wrapper: fixed size (e.g., 80px × 112px), `perspective: 1000px`
   - `.card-inner`: `transform-style: preserve-3d`, transition
   - `.card-front` and `.card-back`: `backface-visibility: hidden`
   - Card face layout: rank + suit in top-left, large suit symbol centered, rank + suit in bottom-right (rotated 180°)
   - Card back pattern in CSS (no images)
9. **Chips** — circle, border-dashed, colors by denomination, hover/active states
10. **Buttons** — styled consistently, gold border, dark bg, text in `Josefin Sans`, hover glow, disabled state (muted, no pointer events)
11. **Panels** — betting-panel and action-panel, centered below table, flex row layout
12. **Result overlay** — full viewport overlay with semi-transparent dark bg, centered message
13. **Toast** — fixed bottom-center, brief opacity animation
14. **Animations** — all keyframes: `dealCard`, `cardFlip`, `winGlow`, `bustShake`, `balanceFlash`, `toastFade`
15. **Split hand layout** — when two hands exist, display them side by side with a clear visual separator and label ("Hand 1" / "Hand 2"); active hand has a gold glow

### Responsive considerations
- Should work on viewport widths down to ~480px
- Cards may scale down slightly on small screens
- Chip tray wraps if needed

---

## Behavior Checklist

Make sure all of the following are handled correctly before finishing:

- [ ] Deck reshuffles correctly when running low (< 15 cards)
- [ ] Aces correctly count as 1 when needed to avoid bust
- [ ] Soft hands are labeled correctly in the UI
- [ ] Blackjack is detected on initial deal for both player and dealer
- [ ] Blackjack pays 3:2 (not 2:1)
- [ ] Double Down deducts extra bet and deals exactly one card then stands
- [ ] Double Down is disabled after the first action on a hand
- [ ] Split correctly handles two separate hands played in sequence
- [ ] Split aces receive exactly one card each and cannot hit
- [ ] 10-value cards of different ranks (e.g., K and Q) can be split
- [ ] Split is disabled after one split (no re-splitting)
- [ ] Dealer reveals hole card before drawing more cards
- [ ] Dealer draws correctly (hit on < 17, stand on soft 17+)
- [ ] Each split hand is evaluated independently for win/loss/push
- [ ] Player cannot bet more than their balance
- [ ] Balance correctly updates after each round
- [ ] Game Over state appears when balance is $0 and player cannot bet
- [ ] All button states (disabled/enabled) are correct at every phase
- [ ] Animations play correctly and do not interfere with game logic (use `Promise`-based delays)
- [ ] No orphaned event listeners (clean up or use event delegation)
- [ ] TypeScript compiles with no errors under `--strict` mode

---

## Example Utility Functions (TypeScript hints)

```typescript
// Delay helper for animation sequencing
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Calculate hand value, returns { value: number, isSoft: boolean }
function calculateHandValue(cards: Card[]): { value: number; isSoft: boolean } { ... }

// Check if two cards can be split
function canSplit(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return cardValue(cards[0].rank) === cardValue(cards[1].rank);
}

// Get numeric value of a rank (Ace = 11 initially)
function cardValue(rank: Rank): number { ... }

// Get suit symbol
function suitSymbol(suit: Suit): string {
  return { spades: '♠', clubs: '♣', hearts: '♥', diamonds: '♦' }[suit];
}

// Determine if suit is red
function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
```

---

## Final Notes

- **Do not use any external JavaScript libraries** — pure TypeScript/CSS only (Google Fonts via CDN in HTML is fine)
- The `game.ts` file should be fully self-contained — no module imports other than type declarations
- All game state lives in a single `GameState` object; avoid scattered global variables
- Comment key sections of TypeScript clearly
- After writing `game.ts`, compile it: `tsc game.ts --target ES2020 --strict --outFile game.js`
- The final product should feel like a piece of software someone would actually want to play
