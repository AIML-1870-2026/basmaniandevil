// ─── Types ────────────────────────────────────────────────────────────────────
interface Card {
  rank: string;
  suit: string;
}

type GamePhase    = 'idle' | 'player' | 'dealer' | 'done';
type Action       = 'hit' | 'stand' | 'double';
type Confidence   = 'high' | 'medium' | 'low';
type ExplainLevel = 'simple' | 'standard' | 'detailed';
type AdvisorState = 'idle' | 'loading' | 'content' | 'error';
type HandResult   = 'blackjack' | 'win' | 'dealer-bust' | 'push' | 'bust' | 'loss';

interface AIResponse {
  action: Action;
  reasoning: string;
  confidence: Confidence;
}

interface Stats {
  wins: number;
  losses: number;
  pushes: number;
  bjs: number;
}

// ─── DOM Helper ───────────────────────────────────────────────────────────────
function $<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ─── State ────────────────────────────────────────────────────────────────────
let apiKey: string | null = null;
let deck: Card[]          = [];
let playerHand: Card[]    = [];
let dealerHand: Card[]    = [];
let balance               = 1000;
let bet                   = 100;
let gamePhase: GamePhase  = 'idle';
let aiRec: AIResponse | null = null;
let explainLvl: ExplainLevel = 'simple';
let autoPlay              = false;
let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;
let baseBet               = 100;

const BET_STEP = 25;
const BET_MIN  = 25;

const stats: Stats         = { wins: 0, losses: 0, pushes: 0, bjs: 0 };
let bankrollHistory: number[] = [1000];

// ─── API Key ──────────────────────────────────────────────────────────────────
function activateKey(key: string): void {
  apiKey = key;
  setKeyStatus('&#10003; Key loaded successfully', 'status-ok');
  setTimeout(() => {
    $('api-setup').style.display      = 'none';
    $('game-container').style.display = 'block';
    renderStats();
  }, 700);
}

$('btn-use-key').addEventListener('click', () => {
  const val = $<HTMLInputElement>('api-key-input').value.trim();
  if (!val)               { setKeyStatus('&#10007; Please enter an API key',      'status-err'); return; }
  if (!val.startsWith('sk-')) { setKeyStatus('&#10007; Key should start with sk-', 'status-err'); return; }
  activateKey(val);
});

$('api-key-input').addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') $('btn-use-key').click();
});

$<HTMLInputElement>('env-file').addEventListener('change', (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev: ProgressEvent<FileReader>) => {
    const txt = ev.target?.result as string;
    const m   = txt.match(/OPENAI_API_KEY\s*=\s*["']?([A-Za-z0-9\-_]+)["']?/);
    if (m) {
      activateKey(m[1]);
    } else {
      setKeyStatus('&#10007; OPENAI_API_KEY not found in file', 'status-err');
    }
  };
  reader.readAsText(file);
});

function setKeyStatus(html: string, cls: string): void {
  const el  = $('key-status');
  el.innerHTML  = html;
  el.className  = cls;
}

// ─── Deck ─────────────────────────────────────────────────────────────────────
const SUITS = ['&#9824;', '&#9829;', '&#9830;', '&#9827;'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck(): void {
  deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function draw(): Card {
  return deck.pop()!;
}

function handValue(hand: Card[]): number {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === 'A')                         { aces++; total += 11; }
    else if (['J', 'Q', 'K'].includes(c.rank))  total += 10;
    else                                         total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isSoft(hand: Card[]): boolean {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === 'A')                         { aces++; total += 11; }
    else if (['J', 'Q', 'K'].includes(c.rank))  total += 10;
    else                                         total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return aces > 0 && total <= 21;
}

// ─── Rendering ────────────────────────────────────────────────────────────────
const RED_SUITS = new Set(['&#9829;', '&#9830;']);

function makeCard(card: Card, hidden: boolean): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'card' + (hidden ? ' hidden' : RED_SUITS.has(card.suit) ? ' red' : '');
  if (!hidden) {
    el.innerHTML = `<div class="card-top">${card.rank}${card.suit}</div>
                    <div class="card-center">${card.suit}</div>
                    <div class="card-bot">${card.rank}${card.suit}</div>`;
  }
  return el;
}

function renderHands(hideDealer: boolean): void {
  const dc = $('dealer-cards');
  const pc = $('player-cards');
  dc.innerHTML = '';
  pc.innerHTML = '';

  dealerHand.forEach((c, i) => dc.appendChild(makeCard(c, hideDealer && i === 0)));
  playerHand.forEach(c => pc.appendChild(makeCard(c, false)));

  const pv = handValue(playerHand);
  $('player-total').textContent = `Total: ${pv}${pv > 21 ? ' — BUST' : ''}`;

  if (hideDealer) {
    $('dealer-total').textContent = `Showing: ${handValue([dealerHand[1]])}`;
  } else {
    const dv = handValue(dealerHand);
    $('dealer-total').textContent = `Total: ${dv}${dv > 21 ? ' — BUST' : ''}`;
  }
}

function setControls(phase: string): void {
  const inPlay = phase === 'player';
  $<HTMLButtonElement>('btn-hit').disabled     = !inPlay;
  $<HTMLButtonElement>('btn-stand').disabled   = !inPlay;
  $<HTMLButtonElement>('btn-double').disabled  = !inPlay || playerHand.length !== 2 || balance < bet;
  $<HTMLButtonElement>('btn-new').disabled     = phase === 'player';
  $<HTMLButtonElement>('btn-execute').disabled = !inPlay || !aiRec;
  updateBetControls(inPlay);
}

function showOutcome(text: string, cls: string): void {
  const el  = $('outcome-msg');
  el.textContent = text;
  el.className   = cls;
}

function updateBalanceDisplay(): void {
  $('bal-display').textContent  = '$' + balance.toLocaleString();
  $('bet-display').textContent  = '$' + baseBet.toLocaleString();
}

function setBet(amount: number): void {
  baseBet = Math.max(BET_MIN, Math.min(amount, balance));
  updateBalanceDisplay();
}

function updateBetControls(disabled: boolean): void {
  const ids = ['btn-bet-down', 'btn-bet-up', 'btn-max-bet'];
  ids.forEach(id => ($<HTMLButtonElement>(id)).disabled = disabled);
  document.querySelectorAll<HTMLButtonElement>('.chip').forEach(c => c.disabled = disabled);
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function renderStats(): void {
  const total = stats.wins + stats.losses + stats.pushes;
  $('s-wins').textContent    = String(stats.wins);
  $('s-losses').textContent  = String(stats.losses);
  $('s-pushes').textContent  = String(stats.pushes);
  $('s-bjs').textContent     = String(stats.bjs);
  $('s-winrate').textContent = total ? Math.round(stats.wins / total * 100) + '%' : '—';
  $('hands-display').textContent = String(total);
  drawChart();
}

function drawChart(): void {
  const canvas = $<HTMLCanvasElement>('bankroll-chart');
  const ctx    = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const hist = bankrollHistory;
  if (hist.length < 2) return;

  const mn   = Math.min(...hist), mx = Math.max(...hist), rng = mx - mn || 1;
  const xFor = (i: number) => (i / (hist.length - 1)) * W;
  const yFor = (v: number) => H - ((v - mn) / rng) * (H - 8) - 4;

  ctx.beginPath();
  hist.forEach((v, i) => i === 0 ? ctx.moveTo(xFor(i), yFor(v)) : ctx.lineTo(xFor(i), yFor(v)));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = 'rgba(76,175,80,0.14)';
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 2;
  hist.forEach((v, i) => i === 0 ? ctx.moveTo(xFor(i), yFor(v)) : ctx.lineTo(xFor(i), yFor(v)));
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.setLineDash([4, 4]);
  const sy = yFor(hist[0]);
  ctx.moveTo(0, sy); ctx.lineTo(W, sy);
  ctx.stroke(); ctx.setLineDash([]);
}

// ─── Advisor Character ────────────────────────────────────────────────────────
function setAdvisorState(state: AdvisorState, action?: Action): void {
  const char  = $('advisor-char');
  const mouth = $('char-mouth');
  const idle  = $('bubble-idle');
  const load  = $('bubble-loading');
  const cont  = $('bubble-content');

  char.className  = 'advisor-char';
  mouth.className = 'char-mouth';
  idle.style.display = 'none';
  load.style.display = 'none';
  cont.style.display = 'none';

  if (state === 'idle') {
    idle.style.display = 'block';
  } else if (state === 'loading') {
    load.style.display = 'block';
    char.classList.add('thinking');
    mouth.classList.add('neutral');
  } else if (state === 'content') {
    cont.style.display = 'block';
    char.classList.add('excited');
    if (action === 'hit' || action === 'double') mouth.classList.add('excited');
    char.addEventListener('animationend', () => {
      char.className = 'advisor-char';
    }, { once: true });
  } else if (state === 'error') {
    idle.style.display = 'block';
    idle.textContent   = 'Hmm, something went wrong. Try again?';
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────
function buildPrompt(level: ExplainLevel): string {
  const pv   = handValue(playerHand);
  const dv   = handValue([dealerHand[1]]);
  const soft = isSoft(playerHand);
  const canD = playerHand.length === 2 && balance >= bet;

  const instructions: Record<ExplainLevel, string> = {
    simple:   'Give the action keyword only in reasoning (one word).',
    standard: 'Give a single-sentence explanation in reasoning.',
    detailed: 'Include bust probabilities, expected value, and full statistical reasoning.',
  };

  return `You are a Blackjack expert. ${instructions[level]}

Game state:
- Player cards: ${playerHand.map(c => c.rank + c.suit).join(', ')} (total: ${pv}${soft ? ', soft' : ''})
- Dealer up card: ${dealerHand[1].rank}${dealerHand[1].suit} (value: ${dv})
- Can double down: ${canD}
- Balance: $${balance}, Bet: $${bet}

Respond ONLY with valid JSON — no markdown, no preamble:
{"action":"hit"|"stand"|"double","reasoning":"...","confidence":"high"|"medium"|"low"}`;
}

async function fetchAI(): Promise<void> {
  if (!apiKey) return;

  setAdvisorState('loading');
  $<HTMLButtonElement>('btn-execute').disabled = true;
  aiRec = null;

  const prompt = buildPrompt(explainLvl);
  console.log('[AI] Prompt:', prompt);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    console.log('[AI] Raw response:', data);

    if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);

    const text: string = data.choices[0].message.content.trim();
    let parsed: AIResponse;
    try {
      parsed = JSON.parse(text) as AIResponse;
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON in response');
      parsed = JSON.parse(m[0]) as AIResponse;
    }

    console.log('[AI] Parsed:', parsed);

    const validActions: Action[] = ['hit', 'stand', 'double'];
    if (!validActions.includes(parsed.action))
      throw new Error('Unexpected action: ' + parsed.action);

    aiRec = parsed;

    const badge = $('ai-badge');
    badge.textContent = parsed.action.toUpperCase();
    badge.className   = 'action-badge a-' + parsed.action;

    const conf = $('ai-conf');
    conf.textContent = parsed.confidence.toUpperCase();
    conf.className   = 'conf-badge c-' + parsed.confidence;

    $('ai-reasoning').textContent = parsed.reasoning;
    setAdvisorState('content', parsed.action);

    const canDouble = playerHand.length === 2 && balance >= bet;
    const actionOk  = parsed.action !== 'double' || canDouble;
    $<HTMLButtonElement>('btn-execute').disabled = gamePhase !== 'player' || !actionOk;

    if (autoPlay && gamePhase === 'player') {
      autoPlayTimer = setTimeout(() => {
        if (!aiRec || gamePhase !== 'player') return;
        if      (aiRec.action === 'hit')    doHit();
        else if (aiRec.action === 'stand')  doStand();
        else if (aiRec.action === 'double' && canDouble) doDouble();
        else                                doStand();
      }, 1500);
    }

  } catch (err) {
    console.error('[AI] Error:', err);
    setAdvisorState('error');
  }
}

// ─── Game Logic ───────────────────────────────────────────────────────────────
function newHand(): void {
  if (balance <= 0) { setAutoPlay(false); showOutcome('No chips left — refresh to restart.', 'lose'); return; }

  clearAutoPlayTimer();
  buildDeck();
  playerHand = [draw(), draw()];
  dealerHand = [draw(), draw()];
  gamePhase  = 'player';
  aiRec      = null;
  bet        = baseBet;

  setAdvisorState('idle');
  $('bubble-idle').textContent = 'Getting my read on this hand…';

  showOutcome('', '');
  renderHands(true);
  setControls('player');
  updateBalanceDisplay();

  if (handValue(playerHand) === 21) { resolveHand(); return; }

  fetchAI();
}

function doHit(): void {
  if (gamePhase !== 'player') return;
  playerHand.push(draw());
  renderHands(true);
  const pv = handValue(playerHand);
  if (pv > 21 || pv === 21) { resolveHand(); } else { fetchAI(); }
}

function doStand(): void {
  if (gamePhase !== 'player') return;
  resolveHand();
}

function doDouble(): void {
  if (gamePhase !== 'player' || playerHand.length !== 2 || balance < bet) return;
  bet *= 2;
  updateBalanceDisplay();
  playerHand.push(draw());
  renderHands(true);
  resolveHand();
}

function resolveHand(): void {
  gamePhase = 'dealer';
  setControls('done');

  const pv = handValue(playerHand);

  if (pv > 21) { renderHands(false); endHand('bust'); return; }

  const playerBJ = pv === 21 && playerHand.length === 2;
  const dealerBJ = handValue(dealerHand) === 21 && dealerHand.length === 2;

  if (playerBJ && dealerBJ) { renderHands(false); endHand('push');      return; }
  if (playerBJ)              { renderHands(false); endHand('blackjack'); return; }

  while (true) {
    const dv = handValue(dealerHand);
    const ds = isSoft(dealerHand);
    if (dv > 17) break;
    if (dv === 17 && !ds) break;
    dealerHand.push(draw());
  }

  renderHands(false);
  const dv = handValue(dealerHand);

  if      (dv > 21) endHand('dealer-bust');
  else if (pv > dv) endHand('win');
  else if (dv > pv) endHand('loss');
  else              endHand('push');
}

function endHand(result: HandResult): void {
  gamePhase = 'done';
  setControls('done');

  let delta = 0;
  switch (result) {
    case 'blackjack':   delta =  Math.floor(bet * 1.5); stats.wins++;   stats.bjs++; showOutcome('BLACKJACK! +$' + delta,      'bj');   break;
    case 'win':         delta =  bet;                    stats.wins++;                showOutcome('You Win! +$' + bet,           'win');  break;
    case 'dealer-bust': delta =  bet;                    stats.wins++;                showOutcome('Dealer Busts! +$' + bet,      'win');  break;
    case 'push':        delta =  0;                      stats.pushes++;              showOutcome('Push — Bet Returned',         'push'); break;
    case 'bust':        delta = -bet;                    stats.losses++;              showOutcome('Bust! -$' + bet,              'lose'); break;
    case 'loss':        delta = -bet;                    stats.losses++;              showOutcome('Dealer Wins. -$' + bet,       'lose'); break;
  }

  balance += delta;
  bankrollHistory.push(balance);
  updateBalanceDisplay();
  renderStats();

  if (autoPlay && balance > 0) {
    autoPlayTimer = setTimeout(newHand, 2000);
  }
}

// ─── Auto-Play ────────────────────────────────────────────────────────────────
function clearAutoPlayTimer(): void {
  if (autoPlayTimer !== null) { clearTimeout(autoPlayTimer); autoPlayTimer = null; }
}

function setAutoPlay(enabled: boolean): void {
  autoPlay = enabled;
  clearAutoPlayTimer();

  const btn    = $('btn-autoplay');
  const status = $('autoplay-status');

  if (enabled) {
    btn.classList.add('on');
    btn.setAttribute('aria-pressed', 'true');
    status.textContent = 'On';
    status.classList.add('on');
    if (gamePhase === 'done' || gamePhase === 'idle') {
      autoPlayTimer = setTimeout(newHand, 1500);
    }
  } else {
    btn.classList.remove('on');
    btn.setAttribute('aria-pressed', 'false');
    status.textContent = 'Off';
    status.classList.remove('on');
  }
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
$('btn-new').addEventListener('click', newHand);
$('btn-hit').addEventListener('click', doHit);
$('btn-stand').addEventListener('click', doStand);
$('btn-double').addEventListener('click', doDouble);

$('btn-execute').addEventListener('click', () => {
  if (!aiRec || gamePhase !== 'player') return;
  if      (aiRec.action === 'hit')    doHit();
  else if (aiRec.action === 'stand')  doStand();
  else if (aiRec.action === 'double') doDouble();
});

document.querySelectorAll<HTMLButtonElement>('.tog').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll<HTMLButtonElement>('.tog').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    explainLvl = (btn.dataset.lvl as ExplainLevel) ?? 'simple';
    if (gamePhase === 'player') fetchAI();
  });
});

$('btn-autoplay').addEventListener('click', () => {
  setAutoPlay(!autoPlay);
});

$('btn-bet-down').addEventListener('click', () => setBet(baseBet - BET_STEP));
$('btn-bet-up').addEventListener('click',   () => setBet(baseBet + BET_STEP));
$('btn-max-bet').addEventListener('click',  () => setBet(balance));

document.querySelectorAll<HTMLButtonElement>('.chip[data-val]').forEach(chip => {
  chip.addEventListener('click', () => {
    const val = parseInt(chip.dataset.val ?? '25');
    setBet(val);
  });
});
