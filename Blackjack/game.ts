// =============================================
// TYPES
// =============================================

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
  isActive: boolean;
  hasStood: boolean;
  hasDoubled: boolean;
  isSplit: boolean;
  id: string;
  isSplitAce: boolean;
}

type GamePhase = 'betting' | 'player-turn' | 'dealer-turn' | 'round-over';

interface GameState {
  deck: Card[];
  playerHands: Hand[];
  activeHandIndex: number;
  dealerHand: Hand;
  balance: number;
  currentBet: number;
  phase: GamePhase;
  hasSplit: boolean;
}

// =============================================
// UTILITY
// =============================================

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

function suitSymbol(suit: Suit): string {
  return { spades: '♠', clubs: '♣', hearts: '♥', diamonds: '♦' }[suit];
}

function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

function calculateHandValue(cards: Card[]): { value: number; isSoft: boolean } {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    if (!card.faceUp) continue;
    value += cardValue(card.rank);
    if (card.rank === 'A') aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  const isSoft = aces > 0 && value <= 21;
  return { value, isSoft };
}

function canSplit(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return cardValue(cards[0].rank) === cardValue(cards[1].rank);
}

function isBlackjack(hand: Hand): boolean {
  return hand.cards.length === 2 &&
    hand.cards.every(c => c.faceUp) &&
    calculateHandValue(hand.cards).value === 21;
}

// =============================================
// DECK
// =============================================

function buildDeck(): Card[] {
  const suits: Suit[] = ['spades', 'clubs', 'hearts', 'diamonds'];
  const ranks: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, faceUp: true });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function ensureDeck(state: GameState): void {
  if (state.deck.length < 15) {
    state.deck = shuffleDeck(buildDeck());
  }
}

function drawCard(state: GameState, faceUp: boolean = true): Card {
  ensureDeck(state);
  const card = state.deck.pop()!;
  card.faceUp = faceUp;
  return card;
}

// =============================================
// GAME STATE INITIALIZATION
// =============================================

function createHand(bet: number, id: string): Hand {
  return {
    cards: [],
    bet,
    isActive: false,
    hasStood: false,
    hasDoubled: false,
    isSplit: false,
    isSplitAce: false,
    id,
  };
}

const CHIP_DENOMINATIONS = [5, 10, 25, 50, 100];

let state: GameState = {
  deck: shuffleDeck(buildDeck()),
  playerHands: [],
  activeHandIndex: 0,
  dealerHand: createHand(0, 'dealer'),
  balance: 1000,
  currentBet: 0,
  phase: 'betting',
  hasSplit: false,
};

// =============================================
// DOM REFS
// =============================================

const elBalance         = document.getElementById('balance')!;
const elCurrentBet      = document.getElementById('current-bet')!;
const elDealerHand      = document.getElementById('dealer-hand')!;
const elDealerValue     = document.getElementById('dealer-value')!;
const elHandsContainer  = document.getElementById('hands-container')!;
const elPlayerValue     = document.getElementById('player-value')!;
const elBettingPanel    = document.getElementById('betting-panel')!;
const elActionPanel     = document.getElementById('action-panel')!;
const elResultOverlay   = document.getElementById('result-overlay')!;
const elResultMessage   = document.getElementById('result-message')!;
const elGameOverOverlay = document.getElementById('game-over-overlay')!;
const elChipTray        = document.getElementById('chip-tray')!;
const elToast           = document.getElementById('toast')!;
const elPlayerZone      = document.getElementById('player-zone')!;

const btnDeal      = document.getElementById('btn-deal') as HTMLButtonElement;
const btnClearBet  = document.getElementById('btn-clear-bet') as HTMLButtonElement;
const btnHit       = document.getElementById('btn-hit') as HTMLButtonElement;
const btnStand     = document.getElementById('btn-stand') as HTMLButtonElement;
const btnDouble    = document.getElementById('btn-double') as HTMLButtonElement;
const btnSplit     = document.getElementById('btn-split') as HTMLButtonElement;
const btnNextRound = document.getElementById('btn-next-round') as HTMLButtonElement;
const btnRestart   = document.getElementById('btn-restart') as HTMLButtonElement;

// =============================================
// RENDER HELPERS
// =============================================

function renderCard(card: Card): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = `card ${card.faceUp ? 'face-up' : 'face-down'}`;

  const inner = document.createElement('div');
  inner.className = 'card-inner';

  // Front face
  const front = document.createElement('div');
  front.className = `card-front ${isRedSuit(card.suit) ? 'red' : 'black'}`;

  const sym = suitSymbol(card.suit);

  front.innerHTML = `
    <div class="card-corner-tl">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit-small">${sym}</span>
    </div>
    <div class="card-center">
      <span class="card-suit-large">${sym}</span>
    </div>
    <div class="card-corner-br">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit-small">${sym}</span>
    </div>
  `;

  // Back face
  const back = document.createElement('div');
  back.className = 'card-back';

  inner.appendChild(front);
  inner.appendChild(back);
  wrapper.appendChild(inner);

  return wrapper;
}

function renderHand(hand: Hand, container: HTMLElement): void {
  container.innerHTML = '';
  for (const card of hand.cards) {
    container.appendChild(renderCard(card));
  }
}

function renderPlayerHands(): void {
  elHandsContainer.innerHTML = '';

  const isSplit = state.playerHands.length > 1;

  state.playerHands.forEach((hand, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = `hand-wrapper${idx === state.activeHandIndex && state.phase === 'player-turn' ? ' active-hand' : ''}`;
    wrapper.id = `hand-wrapper-${hand.id}`;

    if (isSplit) {
      const label = document.createElement('div');
      label.className = 'hand-label';
      label.textContent = `Hand ${idx + 1}  •  $${hand.bet}`;
      wrapper.appendChild(label);
    }

    const handEl = document.createElement('div');
    handEl.className = 'hand';
    handEl.id = hand.id;
    renderHand(hand, handEl);
    wrapper.appendChild(handEl);

    const valueEl = document.createElement('div');
    valueEl.className = 'hand-value';
    const { value, isSoft } = calculateHandValue(hand.cards);
    if (hand.cards.some(c => c.faceUp)) {
      valueEl.textContent = isSoft ? `Soft ${value}` : `${value}`;
    }
    wrapper.appendChild(valueEl);

    elHandsContainer.appendChild(wrapper);
  });

  // Single-hand value display below
  if (!isSplit && state.playerHands.length === 1) {
    const { value, isSoft } = calculateHandValue(state.playerHands[0].cards);
    const visibleCards = state.playerHands[0].cards.filter(c => c.faceUp);
    elPlayerValue.textContent = visibleCards.length > 0
      ? (isSoft ? `Soft ${value}` : `${value}`)
      : '';
  } else {
    elPlayerValue.textContent = '';
  }
}

function renderDealerHand(): void {
  renderHand(state.dealerHand, elDealerHand);
  const visibleCards = state.dealerHand.cards.filter(c => c.faceUp);
  if (visibleCards.length > 0) {
    const { value, isSoft } = calculateHandValue(visibleCards);
    elDealerValue.textContent = isSoft ? `Soft ${value}` : `${value}`;
  } else {
    elDealerValue.textContent = '';
  }
}

function renderChips(): void {
  elChipTray.innerHTML = '';
  for (const denom of CHIP_DENOMINATIONS) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset['value'] = String(denom);
    chip.textContent = `$${denom}`;
    chip.addEventListener('click', () => onChipClick(denom));
    elChipTray.appendChild(chip);
  }
}

function updateHUD(): void {
  elBalance.textContent = `$${state.balance}`;
  elCurrentBet.textContent = `$${state.currentBet}`;
  btnDeal.disabled = state.currentBet === 0 || state.currentBet > state.balance;
}

function flashBalance(): void {
  elBalance.classList.remove('flash');
  void elBalance.offsetWidth; // reflow
  elBalance.classList.add('flash');
  setTimeout(() => elBalance.classList.remove('flash'), 600);
}

// =============================================
// PHASE MANAGEMENT
// =============================================

function setPhase(phase: GamePhase): void {
  state.phase = phase;

  elBettingPanel.classList.toggle('hidden', phase !== 'betting');
  elActionPanel.classList.toggle('hidden', phase !== 'player-turn');
  elResultOverlay.classList.toggle('hidden', phase !== 'round-over');
}

// =============================================
// TOAST
// =============================================

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string): void {
  if (toastTimeout) clearTimeout(toastTimeout);
  elToast.textContent = message;
  elToast.classList.remove('hidden', 'show');
  void elToast.offsetWidth;
  elToast.classList.add('show');
  toastTimeout = setTimeout(() => {
    elToast.classList.remove('show');
    elToast.classList.add('hidden');
  }, 2400);
}

// =============================================
// RESULT DISPLAY
// =============================================

function showResult(message: string, type: 'win' | 'lose' | 'push' | 'blackjack'): void {
  elResultMessage.textContent = message;
  elResultOverlay.className = `result-overlay ${type}`;
  setPhase('round-over');

  // Animate player zone
  elPlayerZone.classList.remove('win-glow', 'bust-shake', 'push-glow', 'bj-flash');
  void elPlayerZone.offsetWidth;

  if (type === 'win') elPlayerZone.classList.add('win-glow');
  else if (type === 'lose') {
    elPlayerZone.classList.add('bust-shake');
    const vignette = document.createElement('div');
    vignette.className = 'bust-vignette';
    document.body.appendChild(vignette);
    setTimeout(() => vignette.remove(), 900);
  } else if (type === 'push') elPlayerZone.classList.add('push-glow');
  else if (type === 'blackjack') elPlayerZone.classList.add('bj-flash');
}

// =============================================
// DEALING WITH ANIMATION
// =============================================

async function dealCardAnimated(hand: Hand, container: HTMLElement, faceUp: boolean = true): Promise<void> {
  const card = drawCard(state, faceUp);
  hand.cards.push(card);

  const cardEl = renderCard(card);
  cardEl.classList.add('dealing');
  container.appendChild(cardEl);

  await delay(400);
}

async function initialDeal(): Promise<void> {
  const hand = state.playerHands[0];
  const playerContainer = document.getElementById(hand.id)!;
  const dealerContainer = elDealerHand;

  // Deal order: player c1, dealer c1, player c2, dealer c2 (face down)
  await dealCardAnimated(hand, playerContainer, true);
  await delay(150);
  await dealCardAnimated(state.dealerHand, dealerContainer, true);
  await delay(150);
  await dealCardAnimated(hand, playerContainer, true);
  await delay(150);
  await dealCardAnimated(state.dealerHand, dealerContainer, false);

  renderDealerHand();
  renderPlayerHands();
}

// =============================================
// BUTTON STATE MANAGEMENT
// =============================================

function updateActionButtons(): void {
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return;

  const isFirstAction = hand.cards.length === 2 && !hand.hasDoubled;
  const canDouble = isFirstAction && !hand.isSplitAce && state.balance >= hand.bet;
  const canSplitNow = isFirstAction && canSplit(hand.cards) && !state.hasSplit && state.balance >= hand.bet;

  btnHit.disabled    = hand.isSplitAce;
  btnStand.disabled  = false;
  btnDouble.disabled = !canDouble;
  btnSplit.disabled  = !canSplitNow;
}

// =============================================
// GAME OVER
// =============================================

function checkGameOver(): boolean {
  if (state.balance <= 0) {
    elGameOverOverlay.classList.remove('hidden');
    return true;
  }
  return false;
}

// =============================================
// ROUND FLOW
// =============================================

async function startRound(): Promise<void> {
  if (state.currentBet === 0) return;

  // Deduct bet
  state.balance -= state.currentBet;
  updateHUD();

  // Reset state for this round
  state.hasSplit = false;
  state.dealerHand = createHand(0, 'dealer');
  state.playerHands = [createHand(state.currentBet, `player-hand-${Date.now()}`)];
  state.activeHandIndex = 0;

  elDealerHand.innerHTML = '';
  elHandsContainer.innerHTML = '';
  elDealerValue.textContent = '';
  elPlayerValue.textContent = '';
  elResultOverlay.classList.add('hidden');
  elPlayerZone.classList.remove('win-glow', 'bust-shake', 'push-glow', 'bj-flash');

  // Create the initial hand DOM element
  const handWrapper = document.createElement('div');
  handWrapper.className = 'hand-wrapper';
  handWrapper.id = `hand-wrapper-${state.playerHands[0].id}`;
  const handEl = document.createElement('div');
  handEl.className = 'hand';
  handEl.id = state.playerHands[0].id;
  handWrapper.appendChild(handEl);
  elHandsContainer.appendChild(handWrapper);

  setPhase('player-turn');
  await initialDeal();

  // Check for blackjack
  const playerBJ = isBlackjack(state.playerHands[0]);
  const dealerBJ = isBlackjack({ ...state.dealerHand, cards: state.dealerHand.cards.map(c => ({ ...c, faceUp: true })) });

  if (playerBJ || dealerBJ) {
    // Reveal hole card
    state.dealerHand.cards[1].faceUp = true;
    renderDealerHand();

    await delay(600);

    if (playerBJ && dealerBJ) {
      // Push
      state.balance += state.currentBet;
      flashBalance();
      showResult('Push — Both Blackjack', 'push');
    } else if (playerBJ) {
      // Player blackjack: 3:2
      const winnings = Math.floor(state.currentBet * 2.5);
      state.balance += winnings;
      flashBalance();
      showResult('Blackjack!', 'blackjack');
    } else {
      // Dealer blackjack
      showResult('Dealer Blackjack', 'lose');
    }
    return;
  }

  updateActionButtons();
}

async function nextHandOrDealerTurn(): Promise<void> {
  // Move to next player hand if available
  const nextIndex = state.playerHands.findIndex(
    (h, i) => i > state.activeHandIndex && !h.hasStood && h.cards.length > 0
  );

  if (nextIndex !== -1) {
    state.activeHandIndex = nextIndex;
    renderPlayerHands();
    updateActionButtons();

    // If it's a split ace, auto-stand
    if (state.playerHands[nextIndex].isSplitAce) {
      state.playerHands[nextIndex].hasStood = true;
      await nextHandOrDealerTurn();
    }
    return;
  }

  // All hands done — dealer turn
  await dealerTurn();
}

async function dealerTurn(): Promise<void> {
  setPhase('dealer-turn');

  // Reveal hole card with flip animation
  state.dealerHand.cards[1].faceUp = true;
  renderDealerHand();
  await delay(700);

  // Dealer draws
  while (true) {
    const { value, isSoft } = calculateHandValue(state.dealerHand.cards);
    // Stand on soft 17+, hit on < 17
    if (value >= 17) break;

    await delay(400);
    const card = drawCard(state, true);
    state.dealerHand.cards.push(card);

    const cardEl = renderCard(card);
    cardEl.classList.add('dealing');
    elDealerHand.appendChild(cardEl);
    await delay(400);
    renderDealerHand();
  }

  await delay(300);
  evaluateRound();
}

function evaluateRound(): void {
  const { value: dealerValue } = calculateHandValue(state.dealerHand.cards);
  const dealerBust = dealerValue > 21;

  let totalWinnings = 0;
  const results: Array<{ type: 'win'|'lose'|'push'; message: string }> = [];

  for (const hand of state.playerHands) {
    const { value: playerValue } = calculateHandValue(hand.cards);
    const playerBust = playerValue > 21;

    if (playerBust) {
      results.push({ type: 'lose', message: 'Bust' });
    } else if (dealerBust) {
      totalWinnings += hand.bet * 2;
      results.push({ type: 'win', message: 'Dealer Busts' });
    } else if (playerValue > dealerValue) {
      totalWinnings += hand.bet * 2;
      results.push({ type: 'win', message: 'You Win' });
    } else if (playerValue === dealerValue) {
      totalWinnings += hand.bet;
      results.push({ type: 'push', message: 'Push' });
    } else {
      results.push({ type: 'lose', message: 'Dealer Wins' });
    }
  }

  state.balance += totalWinnings;
  flashBalance();
  updateHUD();

  // Determine overall display result
  const wins   = results.filter(r => r.type === 'win').length;
  const pushes = results.filter(r => r.type === 'push').length;
  const losses = results.filter(r => r.type === 'lose').length;

  let overallType: 'win'|'lose'|'push';
  let overallMsg: string;

  if (state.playerHands.length > 1) {
    // Split hands — summarize
    const parts = results.map((r, i) => `Hand ${i + 1}: ${r.message}`);
    overallMsg = parts.join('\n');
    if (wins > losses) overallType = 'win';
    else if (losses > wins) overallType = 'lose';
    else overallType = 'push';
  } else {
    overallMsg = results[0].message;
    overallType = results[0].type;
  }

  if (dealerBust && !state.playerHands.every(h => calculateHandValue(h.cards).value > 21)) {
    showToast('Dealer Busts!');
  }

  showResult(overallMsg, overallType);
}

// =============================================
// PLAYER ACTIONS
// =============================================

async function playerHit(): Promise<void> {
  disableActionButtons();

  const hand = state.playerHands[state.activeHandIndex];
  const container = document.getElementById(hand.id)!;

  const card = drawCard(state, true);
  hand.cards.push(card);

  const cardEl = renderCard(card);
  cardEl.classList.add('dealing');
  container.appendChild(cardEl);
  await delay(400);

  renderPlayerHands();

  const { value } = calculateHandValue(hand.cards);
  if (value > 21) {
    showToast('Bust!');
    hand.hasStood = true;
    await delay(600);
    await nextHandOrDealerTurn();
    return;
  }

  // After first hit, disable double/split
  updateActionButtons();
  // Disable double/split since we've already hit
  btnDouble.disabled = true;
  btnSplit.disabled = true;
  btnHit.disabled = false;
  btnStand.disabled = false;
}

async function playerStand(): Promise<void> {
  disableActionButtons();
  state.playerHands[state.activeHandIndex].hasStood = true;
  renderPlayerHands();
  await nextHandOrDealerTurn();
}

async function playerDouble(): Promise<void> {
  disableActionButtons();

  const hand = state.playerHands[state.activeHandIndex];
  state.balance -= hand.bet;
  hand.bet *= 2;
  hand.hasDoubled = true;
  updateHUD();

  const container = document.getElementById(hand.id)!;
  const card = drawCard(state, true);
  hand.cards.push(card);

  const cardEl = renderCard(card);
  cardEl.classList.add('dealing');
  container.appendChild(cardEl);
  await delay(500);

  renderPlayerHands();

  const { value } = calculateHandValue(hand.cards);
  if (value > 21) {
    showToast('Bust!');
  }

  hand.hasStood = true;
  await delay(300);
  await nextHandOrDealerTurn();
}

async function playerSplit(): Promise<void> {
  disableActionButtons();

  const hand = state.playerHands[state.activeHandIndex];
  const isAceSplit = hand.cards[0].rank === 'A';

  state.balance -= hand.bet;
  state.hasSplit = true;

  // Create two new hands from the split
  const hand1 = createHand(hand.bet, `player-hand-${Date.now()}-1`);
  hand1.cards.push(hand.cards[0]);
  hand1.isSplit = true;
  hand1.isSplitAce = isAceSplit;

  const hand2 = createHand(hand.bet, `player-hand-${Date.now()}-2`);
  hand2.cards.push(hand.cards[1]);
  hand2.isSplit = true;
  hand2.isSplitAce = isAceSplit;

  state.playerHands = [hand1, hand2];
  state.activeHandIndex = 0;

  // Re-render split layout
  elHandsContainer.innerHTML = '';
  for (const h of state.playerHands) {
    const wrapper = document.createElement('div');
    wrapper.className = 'hand-wrapper';
    wrapper.id = `hand-wrapper-${h.id}`;
    const hEl = document.createElement('div');
    hEl.className = 'hand';
    hEl.id = h.id;
    renderHand(h, hEl);
    wrapper.appendChild(hEl);
    elHandsContainer.appendChild(wrapper);
  }

  updateHUD();
  await delay(300);

  // Deal a second card to hand 1
  const c1 = drawCard(state, true);
  hand1.cards.push(c1);
  const hand1El = document.getElementById(hand1.id)!;
  const card1El = renderCard(c1);
  card1El.classList.add('dealing');
  hand1El.appendChild(card1El);
  await delay(500);

  // Deal a second card to hand 2
  const c2 = drawCard(state, true);
  hand2.cards.push(c2);
  const hand2El = document.getElementById(hand2.id)!;
  const card2El = renderCard(c2);
  card2El.classList.add('dealing');
  hand2El.appendChild(card2El);
  await delay(500);

  renderPlayerHands();

  // If split aces, auto-stand both and go to dealer
  if (isAceSplit) {
    hand1.hasStood = true;
    hand2.hasStood = true;
    await delay(300);
    await dealerTurn();
    return;
  }

  updateActionButtons();
  enableActionButtons();
}

function disableActionButtons(): void {
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDouble.disabled = true;
  btnSplit.disabled = true;
}

function enableActionButtons(): void {
  btnHit.disabled = false;
  btnStand.disabled = false;
  updateActionButtons();
}

// =============================================
// BETTING
// =============================================

function onChipClick(value: number): void {
  if (state.currentBet + value > state.balance) return;
  state.currentBet += value;
  updateHUD();
}

function clearBet(): void {
  state.currentBet = 0;
  updateHUD();
}

function nextRound(): void {
  // Keep current bet for convenience but reset if can't afford
  if (state.currentBet > state.balance) {
    state.currentBet = 0;
  }
  elResultOverlay.classList.add('hidden');
  setPhase('betting');
  elDealerHand.innerHTML = '';
  elHandsContainer.innerHTML = '';
  elDealerValue.textContent = '';
  elPlayerValue.textContent = '';
  renderChips();
  updateHUD();

  if (checkGameOver()) return;
}

function restartGame(): void {
  state.balance = 1000;
  state.currentBet = 0;
  state.deck = shuffleDeck(buildDeck());
  elGameOverOverlay.classList.add('hidden');
  setPhase('betting');
  elDealerHand.innerHTML = '';
  elHandsContainer.innerHTML = '';
  elDealerValue.textContent = '';
  elPlayerValue.textContent = '';
  renderChips();
  updateHUD();
}

// =============================================
// JACK — THE NOIR STRATEGY ADVISOR
// =============================================

const elJack           = document.getElementById('jack')!;
const elJackBubble     = document.getElementById('jack-bubble')!;
const elJackBubbleText = document.getElementById('jack-bubble-text')!;
const elJackFigure     = document.getElementById('jack-figure')!;
let jackBubbleTimeout: ReturnType<typeof setTimeout> | null = null;

function dealerUpcardValue(): number {
  const card = state.dealerHand.cards.find(c => c.faceUp);
  if (!card) return 0;
  return cardValue(card.rank); // A=11, face=10, else numeric
}

interface JackAdvice { action: string; quip: string; }

function getJackAdvice(): JackAdvice | null {
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return null;

  const dealerShow  = dealerUpcardValue();
  if (dealerShow === 0) return null;

  const { value, isSoft } = calculateHandValue(hand.cards);
  const isFirstAction  = hand.cards.length === 2 && !hand.hasDoubled;
  const canDoubleNow   = isFirstAction && !hand.isSplitAce && state.balance >= hand.bet;
  const canSplitNow    = isFirstAction && canSplit(hand.cards) && !state.hasSplit && state.balance >= hand.bet;

  // ——— PAIRS ———
  if (canSplitNow) {
    const pv = cardValue(hand.cards[0].rank);
    const r  = hand.cards[0].rank;

    if (r === 'A')  return { action: 'Split',  quip: "Always split aces. Always. Don't make me say it twice." };
    if (pv === 8)   return { action: 'Split',  quip: "Eights. You split them. No exceptions — that's the code." };
    if (pv === 10)  return { action: 'Stand',  quip: "Twenty. Nobody splits a winning hand. Walk away." };
    if (pv === 5) {
      if (dealerShow <= 9 && canDoubleNow)
        return { action: 'Double', quip: "Don't break those fives — together they're worth more. Double." };
      return { action: 'Hit', quip: "Never split fives. Hit. Treat it as ten." };
    }
    if (pv === 4) {
      if (dealerShow === 5 || dealerShow === 6)
        return { action: 'Split', quip: "Dealer's showing weakness. Split those fours and press your advantage." };
      return { action: 'Hit', quip: "Fours here — don't split. Take a hit and build." };
    }
    if (pv === 9) {
      if (dealerShow === 7 || dealerShow === 10 || dealerShow === 11)
        return { action: 'Stand', quip: "Eighteen is enough against that card. Stand. Let them come to you." };
      return { action: 'Split', quip: "Nines against that upcard — split them. Two hands, two chances." };
    }
    if (pv === 7) {
      if (dealerShow <= 7)
        return { action: 'Split', quip: "Sevens against a seven or lower. Split. Play the odds." };
      return { action: 'Hit', quip: "Too strong a dealer to split those sevens. Hit." };
    }
    if (pv === 6) {
      if (dealerShow >= 2 && dealerShow <= 6)
        return { action: 'Split', quip: "Sixes against a weak dealer. Split them. Make 'em earn it." };
      return { action: 'Hit', quip: "Sixes against that card — don't split. Take a hit." };
    }
    if (pv === 2 || pv === 3) {
      if (dealerShow >= 2 && dealerShow <= 7)
        return { action: 'Split', quip: `Two ${r}s, weak dealer. Split. Small edges add up over time.` };
      return { action: 'Hit', quip: "Dealer's too strong. Don't split those small cards. Hit." };
    }
  }

  // ——— SOFT HANDS ———
  if (isSoft) {
    if (value >= 19) return { action: 'Stand', quip: "Soft nineteen or better. You stand. This isn't debatable." };
    if (value === 18) {
      if (dealerShow >= 3 && dealerShow <= 6 && canDoubleNow)
        return { action: 'Double', quip: "Soft eighteen against their weakness. Double down. The math's in your corner." };
      if (dealerShow >= 9)
        return { action: 'Hit', quip: "Soft eighteen won't hold up against that. Hit — you need more." };
      return { action: 'Stand', quip: "Soft eighteen. Stand here. A solid number under the circumstances." };
    }
    if (value === 17) {
      if (dealerShow >= 3 && dealerShow <= 6 && canDoubleNow)
        return { action: 'Double', quip: "Soft seventeen, dealer's weak. Double. This is the play." };
      return { action: 'Hit', quip: "Soft seventeen. You hit. The ace is your insurance — use it." };
    }
    if (value === 16 || value === 15) {
      if (dealerShow >= 4 && dealerShow <= 6 && canDoubleNow)
        return { action: 'Double', quip: "Dealer's hurting. Double that soft hand — it's the right move." };
      return { action: 'Hit', quip: "Soft hand, room to grow. Hit. You can't bust on this one." };
    }
    // soft 13-14
    if ((dealerShow === 5 || dealerShow === 6) && canDoubleNow)
      return { action: 'Double', quip: "Dealer's got a five or six. Take the double. They're in trouble." };
    return { action: 'Hit', quip: "Hit it. That ace gives you room to maneuver. Use it wisely." };
  }

  // ——— HARD HANDS ———
  if (value >= 17) return { action: 'Stand', quip: "Seventeen or better. You stand. That's not advice — that's law." };

  if (value >= 13 && value <= 16) {
    if (dealerShow >= 7)
      return { action: 'Hit',   quip: `Hard ${value} against a strong dealer. It stings, but you hit. The numbers say so.` };
    return   { action: 'Stand', quip: `Hard ${value} against a bust card. Stand. Let the dealer do the dirty work.` };
  }
  if (value === 12) {
    if (dealerShow >= 4 && dealerShow <= 6)
      return { action: 'Stand', quip: "Twelve against a four, five, or six. Stand. Their bust card does the work." };
    return   { action: 'Hit',   quip: "Twelve against that — you have to hit. Ugly, but it's right." };
  }
  if (value === 11) {
    if (dealerShow <= 10 && canDoubleNow)
      return { action: 'Double', quip: "Eleven. You double. Every time. Half this deck is tens." };
    return   { action: 'Hit',   quip: "Eleven against an ace. Hit — the double is too dangerous here." };
  }
  if (value === 10) {
    if (dealerShow <= 9 && canDoubleNow)
      return { action: 'Double', quip: "Ten against a weak dealer. Double down. The face cards are waiting for you." };
    return   { action: 'Hit',   quip: "Hit it. Ten's a good foundation. Build on it." };
  }
  if (value === 9) {
    if (dealerShow >= 3 && dealerShow <= 6 && canDoubleNow)
      return { action: 'Double', quip: "Nine against a bust card. Double if you can — the timing is right." };
    return   { action: 'Hit',   quip: "Hit the nine. Build something worth standing on." };
  }
  // 8 or less
  return { action: 'Hit', quip: "You hit. No question. You're too low to even consider stopping." };
}

function showJackBubble(action: string, quip: string, cost?: number): void {
  if (jackBubbleTimeout) clearTimeout(jackBubbleTimeout);

  const costHtml = cost != null
    ? `<span class="jack-bubble-cost">— consultation fee: $${cost}</span>`
    : '';

  elJackBubbleText.innerHTML = `
    <span class="jack-bubble-action">${action}</span>
    <span class="jack-bubble-quip">${quip}</span>
    ${costHtml}
  `;

  elJackBubble.classList.remove('hidden', 'speaking');
  void elJackBubble.offsetWidth; // force reflow to restart animation
  elJackBubble.classList.add('speaking');

  // Nod animation
  elJackFigure.classList.remove('nodding');
  void elJackFigure.offsetWidth;
  elJackFigure.classList.add('nodding');
  setTimeout(() => elJackFigure.classList.remove('nodding'), 900);

  jackBubbleTimeout = setTimeout(() => {
    elJackBubble.classList.remove('speaking');
    elJackBubble.classList.add('hidden');
  }, 5100);
}

function onJackClick(): void {
  if (state.phase !== 'player-turn') {
    showJackBubble('—', "I only dispense wisdom at the table, friend. Come back when the cards are dealt.");
    return;
  }

  const cost = Math.max(1, Math.floor(state.balance * 0.05));
  if (state.balance < cost) {
    showJackBubble('—', "You can't afford my counsel anymore. Free advice: walk away while you still can.");
    return;
  }

  const advice = getJackAdvice();
  if (!advice) {
    showJackBubble('—', "Nothing I can read from here, friend. Trust your gut.");
    return;
  }

  state.balance -= cost;
  updateHUD();
  flashBalance();

  showJackBubble(advice.action, advice.quip, cost);
}

elJack.addEventListener('click', onJackClick);

// =============================================
// EVENT LISTENERS
// =============================================

btnDeal.addEventListener('click', () => startRound());
btnClearBet.addEventListener('click', clearBet);
btnHit.addEventListener('click', () => playerHit());
btnStand.addEventListener('click', () => playerStand());
btnDouble.addEventListener('click', () => playerDouble());
btnSplit.addEventListener('click', () => playerSplit());
btnNextRound.addEventListener('click', nextRound);
btnRestart.addEventListener('click', restartGame);

// =============================================
// INIT
// =============================================

renderChips();
updateHUD();
setPhase('betting');
