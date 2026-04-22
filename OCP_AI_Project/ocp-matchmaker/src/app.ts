import { SHOWS, FORM_QUESTIONS } from './data.ts';
import { buildSystemPrompt, sendChatMessage, getRecommendation } from './api.ts';
import type { AppState, Message } from './types.ts';

// ============================
// State
// ============================

const state: AppState = {
  view: 'landing',
  formStep: 0,
  formAnswers: {},
  messages: [],
  shows: SHOWS,
  apiKey: sessionStorage.getItem('ocp_api_key') ?? '',
  isLoading: false,
  matchResult: null,
};

// ============================
// Render
// ============================

function render(): void {
  const app = document.getElementById('app')!;

  switch (state.view) {
    case 'landing': app.innerHTML = viewLanding(); break;
    case 'apikey':  app.innerHTML = viewApiKey();  break;
    case 'form':    app.innerHTML = viewForm();    break;
    case 'chat':    app.innerHTML = viewChat();    break;
    case 'result':  app.innerHTML = viewResult();  break;
  }

  if (state.isLoading) {
    app.insertAdjacentHTML('beforeend', viewLoading());
  }

  attachListeners();
}

// ============================
// Views
// ============================

function viewLanding(): string {
  const current  = state.shows.filter((s) => s.isCurrentlyRunning);
  const upcoming = state.shows.filter((s) => !s.isCurrentlyRunning);

  return `
    <nav class="nav">
      <div>
        <div class="nav__logo">Omaha Community Playhouse</div>
        <div class="nav__subtitle">Show Matchmaker</div>
      </div>
    </nav>

    <section class="landing">
      <div class="landing__curtain-left"></div>
      <div class="landing__curtain-right"></div>

      <div class="landing__content">
        <p class="landing__eyebrow">✦ Omaha Community Playhouse ✦</p>

        <h1 class="landing__title">
          Find Your <em>Perfect</em><br>Night at the Theatre
        </h1>

        <p class="landing__description">
          Answer a few quick questions and let our AI concierge guide you to the show
          that's just right for you — complete with everything you need to secure your seats.
        </p>

        <button class="landing__cta" id="start-btn">
          Find My Perfect Show
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="landing__shows">
          ${current.map((s)  => `<span class="landing__show-pill">Now Playing: ${s.title}</span>`).join('')}
          ${upcoming.map((s) => `<span class="landing__show-pill">Coming Soon: ${s.title}</span>`).join('')}
        </div>
      </div>

      <p class="landing__footer-note">Extraordinary Theatre, Crafted Here — Since 1924</p>
    </section>
  `;
}

function viewApiKey(): string {
  return `
    <nav class="nav">
      <div>
        <div class="nav__logo">Omaha Community Playhouse</div>
        <div class="nav__subtitle">Show Matchmaker</div>
      </div>
    </nav>

    <div class="apikey-screen">
      <div class="apikey-card">
        <div class="apikey-card__icon">🔑</div>
        <h2>Enter Your API Key</h2>
        <p>
          This app uses OpenAI to match you with the perfect show.
          Enter your OpenAI API key to get started. It's stored only in
          your browser session and sent exclusively to OpenAI's API.
        </p>

        <div class="input-group">
          <label for="api-key-input">OpenAI API Key</label>
          <input
            type="password"
            id="api-key-input"
            placeholder="sk-..."
            value="${esc(state.apiKey)}"
            autocomplete="off"
          />
        </div>

        <button class="btn btn--primary btn--full" id="save-key-btn">
          Continue to Matchmaker
        </button>

        <p class="text-muted mt-16 text-sm text-center">
          Get a key at
          <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--color-gold)">
            platform.openai.com
          </a>
        </p>
      </div>
    </div>
  `;
}

function viewForm(): string {
  const question   = FORM_QUESTIONS[state.formStep];
  const progress   = (state.formStep / FORM_QUESTIONS.length) * 100;
  const isMulti    = question.type === 'multi';
  const current    = state.formAnswers[question.id];
  const selected   = isMulti
    ? ((current as string[]) ?? [])
    : [(current as string) ?? ''];
  const hasAnswer  = isMulti ? selected.length > 0 : !!current;
  const isLast     = state.formStep === FORM_QUESTIONS.length - 1;

  return `
    <nav class="nav">
      <div>
        <div class="nav__logo">Omaha Community Playhouse</div>
        <div class="nav__subtitle">Show Matchmaker</div>
      </div>
    </nav>

    <div class="form-screen">
      <div class="container container--narrow">

        <div class="progress-bar">
          <div class="progress-bar__track">
            <div class="progress-bar__fill" style="width:${progress}%"></div>
          </div>
          <div class="progress-bar__label">
            <span>${state.formStep + 1} of ${FORM_QUESTIONS.length}</span>
            <span>${isMulti ? 'Select all that apply' : 'Select one'}</span>
          </div>
        </div>

        <div class="form-question">
          <h2 class="form-question__label">${question.label}</h2>
          ${question.hint ? `<p class="form-question__hint">${question.hint}</p>` : ''}

          <div class="answer-grid">
            ${question.options.map((opt) => `
              <button
                class="answer-option${selected.includes(opt.value) ? ' selected' : ''}"
                data-value="${opt.value}"
                data-question="${question.id}"
                data-type="${question.type}"
              >
                ${opt.icon ? `<span class="answer-option__icon">${opt.icon}</span>` : ''}
                <div>
                  <div class="answer-option__text">${opt.label}</div>
                  ${opt.sub ? `<div class="answer-option__sub">${opt.sub}</div>` : ''}
                </div>
              </button>
            `).join('')}
          </div>

          <div class="form-nav">
            <button
              class="btn btn--secondary"
              id="prev-btn"
              ${state.formStep === 0 ? 'style="visibility:hidden"' : ''}
            >← Back</button>
            <button
              class="btn btn--primary"
              id="next-btn"
              ${!hasAnswer ? 'disabled' : ''}
            >${isLast ? 'Start Chat →' : 'Next →'}</button>
          </div>
        </div>

      </div>
    </div>
  `;
}

function viewChat(): string {
  const bubbles = state.messages.map((msg) => `
    <div class="chat-message chat-message--${msg.role}">
      <div class="chat-message__avatar">${msg.role === 'assistant' ? '🎭' : '👤'}</div>
      <div class="chat-message__bubble">${esc(msg.content)}</div>
    </div>
  `).join('');

  const typing = state.isLoading ? `
    <div class="chat-typing">
      <div class="chat-typing__avatar">🎭</div>
      <div class="chat-typing__dots">
        <div class="chat-typing__dot"></div>
        <div class="chat-typing__dot"></div>
        <div class="chat-typing__dot"></div>
      </div>
    </div>
  ` : '';

  const showRecommendBtn = state.messages.length >= 3 && !state.isLoading;

  return `
    <nav class="nav">
      <div>
        <div class="nav__logo">Omaha Community Playhouse</div>
        <div class="nav__subtitle">Show Matchmaker</div>
      </div>
    </nav>

    <div class="chat-screen">
      <div class="chat-header">
        <div class="chat-header__avatar">🎭</div>
        <h2>Your OCP Concierge</h2>
        <p>A few quick questions before your personalized recommendation</p>
      </div>

      <div class="chat-messages" id="chat-messages">
        ${bubbles}${typing}
      </div>

      <div class="chat-input-area">
        <div class="chat-input-row">
          <textarea
            class="chat-input"
            id="chat-input"
            placeholder="Type your message..."
            rows="1"
            ${state.isLoading ? 'disabled' : ''}
          ></textarea>
          <button class="chat-send-btn" id="chat-send" ${state.isLoading ? 'disabled' : ''}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M16 9L2 2.5l2.5 6.5L2 15.5 16 9z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        ${showRecommendBtn ? `
          <button class="btn btn--primary chat-recommend-btn" id="recommend-btn">
            ✦ Get My Show Recommendation
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function viewResult(): string {
  if (!state.matchResult) return '<p style="padding:120px 24px;text-align:center">No result.</p>';

  const show = state.shows.find((s) => s.id === state.matchResult!.recommendedShowId);
  if (!show) return '<p style="padding:120px 24px;text-align:center">Show not found.</p>';

  const comps = state.matchResult.comparisons
    .map((c) => ({ ...c, show: state.shows.find((s) => s.id === c.showId) }))
    .filter((c) => c.show != null);

  return `
    <nav class="nav">
      <div>
        <div class="nav__logo">Omaha Community Playhouse</div>
        <div class="nav__subtitle">Your Perfect Match</div>
      </div>
    </nav>

    <div class="result-screen">
      <div class="container">

        <!-- Hero -->
        <div class="result-hero">
          <div class="result-hero__fallback">
            <div style="text-align:center;opacity:0.25;">
              <div style="font-size:3.5rem;margin-bottom:10px;">🎭</div>
              <div style="font-family:var(--font-serif);font-size:1rem;letter-spacing:0.08em;">${esc(show.venue)}</div>
            </div>
          </div>
          <div class="result-hero__overlay"></div>
          <div class="result-hero__content">
            <div class="result-hero__badge">✦ Your Perfect Match</div>
            <h1 class="result-hero__title">${esc(show.title)}</h1>
            <p class="result-hero__dates">${esc(show.dates)}</p>
          </div>
        </div>

        <!-- Why it's your match -->
        <div class="result-section">
          <p class="result-section__title">Why It's Your Match</p>
          <p class="result-reason">"${esc(state.matchResult.reason)}"</p>
        </div>

        <!-- About the show -->
        <div class="result-section">
          <p class="result-section__title">About the Show</p>
          <p class="result-overview">${esc(show.description)}</p>

          ${show.contentAdvisory ? `
            <div class="tag-list mt-16">
              <span class="tag">⚠ ${esc(show.contentAdvisory)}</span>
            </div>
          ` : ''}

          <div class="info-grid mt-20">
            <div class="info-item">
              <span class="info-item__label">Venue</span>
              <span class="info-item__value">${esc(show.venue)}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Capacity</span>
              <span class="info-item__value">${esc(show.venueCapacity)}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Dates</span>
              <span class="info-item__value">${esc(show.dates)}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Address</span>
              <span class="info-item__value">6915 Cass St., Omaha, NE 68132</span>
            </div>
          </div>

          ${show.genres.length > 0 ? `
            <div class="tag-list mt-16">
              ${show.genres.map((g) => `<span class="tag tag--gold">${esc(g)}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Tickets -->
        <div class="ticket-section">
          <p class="result-section__title">Get Your Tickets</p>

          <div class="ticket-info-grid">
            <div class="ticket-info-item">
              <span class="ticket-info-item__icon">📞</span>
              <div class="ticket-info-item__text">
                <strong>Box Office</strong>(402) 553-0800
              </div>
            </div>
            <div class="ticket-info-item">
              <span class="ticket-info-item__icon">🕐</span>
              <div class="ticket-info-item__text">
                <strong>Hours</strong>Mon – Sat: Noon – 6 pm
              </div>
            </div>
            <div class="ticket-info-item">
              <span class="ticket-info-item__icon">🚗</span>
              <div class="ticket-info-item__text">
                <strong>Parking</strong>Free on-site parking available
              </div>
            </div>
            <div class="ticket-info-item">
              <span class="ticket-info-item__icon">⏰</span>
              <div class="ticket-info-item__text">
                <strong>Arrive Early</strong>At least 15 minutes before curtain
              </div>
            </div>
          </div>

          <div class="ticket-cta">
            <a href="${show.ticketUrl}" target="_blank" rel="noopener"
               class="btn btn--primary btn--lg btn--full">
              Buy Tickets for ${esc(show.title)} →
            </a>
            <a href="https://omahaplayhouse.com/productions/" target="_blank" rel="noopener"
               class="btn btn--outline-gold btn--full">
              See All Shows at OCP
            </a>
          </div>

          <p class="text-muted text-sm text-center mt-16">
            Season Ticket Holders: Call (402) 553-0800 to reserve your seats
          </p>
        </div>

        ${show.specialEvents.length > 0 ? `
          <div class="result-section">
            <p class="result-section__title">Special Events</p>
            <div class="tag-list">
              ${show.specialEvents.map((e) => `<span class="tag tag--gold">⭐ ${esc(e)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${show.accessibility.length > 0 ? `
          <div class="result-section">
            <p class="result-section__title">Accessibility</p>
            <div class="tag-list">
              ${show.accessibility.map((a) => `<span class="tag">♿ ${esc(a)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- What to expect -->
        <div class="result-section">
          <p class="result-section__title">What to Expect</p>
          <p class="result-overview">${esc(show.venueDescription)}</p>
          <p class="result-overview mt-16">
            OCP has been producing extraordinary community theatre since 1924.
            Expect high-caliber production values, professional direction, and a warm,
            welcoming atmosphere. Dress is casual to smart casual — come as you are.
          </p>
        </div>

        <!-- Compare other shows -->
        ${comps.length > 0 ? `
          <div class="result-section">
            <p class="result-section__title">Also Playing at OCP</p>
            <div class="compare-grid">
              ${comps.map((c) => c.show ? `
                <div class="compare-card">
                  <h3 class="compare-card__title">${esc(c.show.title)}</h3>
                  <p class="compare-card__dates">${esc(c.show.dates)}</p>
                  <p class="compare-card__note">${esc(c.note)}</p>
                </div>
              ` : '').join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="result-footer">
          <p class="text-muted text-sm">Loved your match? Come back anytime to find another.</p>
          <div class="result-footer-actions">
            <button class="btn btn--secondary" id="start-over-btn">↺ Start Over</button>
            <a href="https://omahaplayhouse.com/buy-tickets/season-tickets/"
               target="_blank" rel="noopener" class="btn btn--outline-gold">
              Get Season Tickets
            </a>
          </div>
          <p class="text-muted text-sm">OCP · 6915 Cass St., Omaha, NE 68132 · (402) 553-0800</p>
        </div>

      </div>
    </div>
  `;
}

function viewLoading(): string {
  return `
    <div class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Finding your perfect show…</p>
      </div>
    </div>
  `;
}

// ============================
// Event Listeners
// ============================

function attachListeners(): void {
  switch (state.view) {
    case 'landing': {
      document.getElementById('start-btn')?.addEventListener('click', () => {
        state.view = state.apiKey ? 'form' : 'apikey';
        render();
      });
      break;
    }

    case 'apikey': {
      const input = document.getElementById('api-key-input') as HTMLInputElement;
      const saveBtn = document.getElementById('save-key-btn');

      const saveKey = () => {
        const key = input.value.trim();
        if (!key) return;
        state.apiKey = key;
        sessionStorage.setItem('ocp_api_key', key);
        state.view = 'form';
        render();
      };

      saveBtn?.addEventListener('click', saveKey);
      input?.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') saveKey();
      });
      break;
    }

    case 'form': {
      document.querySelectorAll<HTMLButtonElement>('.answer-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          const value    = btn.dataset['value']!;
          const qId      = btn.dataset['question']!;
          const type     = btn.dataset['type']!;

          if (type === 'multi') {
            const prev = (state.formAnswers[qId] as string[]) ?? [];
            state.formAnswers[qId] = prev.includes(value)
              ? prev.filter((v) => v !== value)
              : [...prev, value];
            render();
          } else {
            state.formAnswers[qId] = value;
            render();
            // Auto-advance single-choice after brief pause
            setTimeout(() => {
              if (state.formStep < FORM_QUESTIONS.length - 1) {
                state.formStep++;
                render();
              } else {
                void startChat();
              }
            }, 320);
          }
        });
      });

      document.getElementById('next-btn')?.addEventListener('click', () => {
        if (state.formStep < FORM_QUESTIONS.length - 1) {
          state.formStep++;
          render();
        } else {
          void startChat();
        }
      });

      document.getElementById('prev-btn')?.addEventListener('click', () => {
        if (state.formStep > 0) {
          state.formStep--;
          render();
        }
      });
      break;
    }

    case 'chat': {
      const input   = document.getElementById('chat-input') as HTMLTextAreaElement;
      const sendBtn = document.getElementById('chat-send');

      input?.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });

      input?.addEventListener('keydown', (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' && !ke.shiftKey) {
          ke.preventDefault();
          void sendUserMessage();
        }
      });

      sendBtn?.addEventListener('click', () => void sendUserMessage());

      document.getElementById('recommend-btn')?.addEventListener('click', () => void fetchRecommendation());

      scrollChatToBottom();
      break;
    }

    case 'result': {
      document.getElementById('start-over-btn')?.addEventListener('click', () => {
        state.view        = 'landing';
        state.formStep    = 0;
        state.formAnswers = {};
        state.messages    = [];
        state.matchResult = null;
        render();
      });
      break;
    }
  }
}

// ============================
// Chat Logic
// ============================

async function startChat(): Promise<void> {
  state.view     = 'chat';
  state.messages = [];
  state.isLoading = true;
  render();

  const intro: Message = {
    role: 'user',
    content: "Hi! I've answered some questions about my preferences. Can you help me find the perfect show at OCP?",
  };

  state.messages = [intro];

  try {
    const system   = buildSystemPrompt(state.shows, state.formAnswers);
    const response = await sendChatMessage(state.apiKey, state.messages, system);
    state.messages = [...state.messages, { role: 'assistant', content: response }];
  } catch (err) {
    state.messages = [
      ...state.messages,
      {
        role: 'assistant',
        content: `I'm having trouble connecting right now. Please check your API key and try again. (${(err as Error).message})`,
      },
    ];
  }

  state.isLoading = false;
  render();
}

async function sendUserMessage(): Promise<void> {
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;
  const text  = input?.value.trim();
  if (!text || state.isLoading) return;

  state.messages  = [...state.messages, { role: 'user', content: text }];
  state.isLoading = true;
  render();

  try {
    const system   = buildSystemPrompt(state.shows, state.formAnswers);
    const response = await sendChatMessage(state.apiKey, state.messages, system);
    state.messages = [...state.messages, { role: 'assistant', content: response }];
  } catch (err) {
    state.messages = [
      ...state.messages,
      { role: 'assistant', content: `Something went wrong: ${(err as Error).message}` },
    ];
  }

  state.isLoading = false;
  render();
}

async function fetchRecommendation(): Promise<void> {
  state.isLoading = true;
  render();

  try {
    const result    = await getRecommendation(state.apiKey, state.shows, state.formAnswers, state.messages);
    state.matchResult = result;
    state.view        = 'result';
  } catch (err) {
    state.messages = [
      ...state.messages,
      { role: 'assistant', content: `I had trouble generating your recommendation. ${(err as Error).message} Please try again.` },
    ];
  }

  state.isLoading = false;
  render();
}

// ============================
// Utilities
// ============================

function scrollChatToBottom(): void {
  requestAnimationFrame(() => {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function esc(text: string): string {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(text));
  return d.innerHTML;
}

// ============================
// Boot
// ============================

render();
