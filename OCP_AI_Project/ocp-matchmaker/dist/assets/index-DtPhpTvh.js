(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(n){if(n.ep)return;n.ep=!0;const a=s(n);fetch(n.href,a)}})();const _=[{id:"dial-m",title:'Dial "M" for Murder',dates:"April 17 – May 10, 2026",startDate:"2026-04-17",endDate:"2026-05-10",venue:"Hawks Mainstage",venueCapacity:"560-seat proscenium theatre",venueDescription:"The Hawks Mainstage is a grand 560-seat proscenium theatre — OCP's primary stage for full-scale productions with a classic theatrical atmosphere.",description:`A perfect crime has been planned to the last detail... but something goes terribly wrong. Based on Frederick Knott's classic thriller, Dial "M" for Murder is a gripping tale of murder, deception, and one detective's relentless pursuit of the truth. Electrifying suspense from curtain up to curtain down.`,contentAdvisory:"Contains depictions of violence and adult themes. Recommended for ages 14+.",ticketUrl:"https://ticketomaha.com/",imageUrl:"",specialEvents:["Talk Back Thursday (April 24)","Audio Described Performance (May 3)"],accessibility:["Audio Description","Assistive Listening","Accessible Seating"],genres:["Mystery","Thriller","Drama"],ageRating:"adult",isCurrentlyRunning:!0},{id:"weisenheimers",title:"The Weisenheimers",dates:"April 25, 2026 (Special Event)",startDate:"2026-04-25",endDate:"2026-04-25",venue:"Howard Drew Theatre",venueCapacity:"200-seat black box theatre",venueDescription:"The intimate Howard Drew Theatre is a 200-seat black box space perfect for up-close, immersive comedy and experimental performances.",description:"A one-night-only special event featuring OCP's beloved improv comedy troupe, The Weisenheimers. Expect rapid-fire scenes, sharp wit, audience participation, and non-stop laughs from start to finish.",contentAdvisory:"Family-friendly. May contain mild comedic adult content.",ticketUrl:"https://ticketomaha.com/",imageUrl:"",specialEvents:["Post-show meet & greet with performers"],accessibility:["Assistive Listening","Accessible Seating"],genres:["Comedy","Improv","Special Event"],ageRating:"family",isCurrentlyRunning:!0},{id:"mary-poppins",title:"Cameron Mackintosh and Disney's Mary Poppins",dates:"May 29 – June 28, 2026",startDate:"2026-05-29",endDate:"2026-06-28",venue:"Hawks Mainstage",venueCapacity:"560-seat proscenium theatre",venueDescription:"The Hawks Mainstage is a grand 560-seat proscenium theatre — the perfect stage for this full-scale Broadway-style musical spectacle.",description:"The beloved story of the world's most magical nanny comes to life in this spectacular musical. Featuring beloved songs from the classic film plus brand new ones from the original Broadway production. A truly supercalifragilistic experience for the entire family.",contentAdvisory:"Suitable for all ages. Contains theatrical special effects and flying sequences.",ticketUrl:"https://ticketomaha.com/",imageUrl:"",specialEvents:["Sensory-Friendly Performance (June 7)","Relaxed Performance (June 14)","Stage & Story Discussion (June 20)"],accessibility:["Audio Description","Assistive Listening","Relaxed Performance","Accessible Seating"],genres:["Musical","Family","Comedy"],ageRating:"all-ages",isCurrentlyRunning:!1},{id:"newsies-jr",title:"Disney's Newsies Jr.",dates:"June 26–28, 2026",startDate:"2026-06-26",endDate:"2026-06-28",venue:"Hawks Mainstage",venueCapacity:"560-seat proscenium theatre",venueDescription:"The Hawks Mainstage provides an exciting backdrop for these young performers bringing a rousing Broadway musical to the Omaha community.",description:"Young performers bring this rousing musical to life! Set in New York City in 1899, Newsies Jr. tells the story of a band of brave young newsboys who stand up against an unfair publisher. Full of high-energy dancing, soaring vocals, and an inspiring message.",contentAdvisory:"Suitable for all ages. Features young performers.",ticketUrl:"https://ticketomaha.com/",imageUrl:"",specialEvents:[],accessibility:["Assistive Listening","Accessible Seating"],genres:["Musical","Family","Youth Production"],ageRating:"all-ages",isCurrentlyRunning:!1}],m=[{id:"group",label:"Who are you bringing tonight?",hint:"Select the option that best describes your group",type:"single",options:[{value:"solo",label:"Just me",icon:"🎭"},{value:"date",label:"Date night",icon:"💑",sub:"Romantic evening for two"},{value:"family",label:"Family with kids",icon:"👨‍👩‍👧",sub:"Including children"},{value:"friends",label:"Friend group",icon:"👥",sub:"A fun night out"},{value:"corporate",label:"Corporate outing",icon:"💼",sub:"Work group or team"}]},{id:"mood",label:"What's the vibe you're going for?",hint:"Pick the mood that sounds most appealing",type:"single",options:[{value:"thriller",label:"Thrilled & on-edge",icon:"😱",sub:"Suspense and mystery"},{value:"comedy",label:"Laugh-out-loud fun",icon:"😂",sub:"Light and hilarious"},{value:"emotional",label:"Emotionally moved",icon:"🥺",sub:"Touching and heartfelt"},{value:"classic",label:"Something classic",icon:"🎩",sub:"Timeless storytelling"},{value:"surprise",label:"Surprise me",icon:"✨",sub:"I'm open to anything"}]},{id:"genres",label:"Any genre preferences?",hint:"Select all that appeal to you",type:"multi",options:[{value:"musical",label:"Musical",icon:"🎵"},{value:"mystery",label:"Mystery / Thriller",icon:"🔍"},{value:"drama",label:"Drama",icon:"🎭"},{value:"comedy",label:"Comedy",icon:"😄"},{value:"family",label:"Family-friendly",icon:"⭐"}]},{id:"ageRange",label:"What's the age range of your group?",type:"single",options:[{value:"all-adults",label:"All adults",icon:"👤"},{value:"mixed",label:"Mix of adults & kids",icon:"👨‍👧",sub:"Various ages"},{value:"mostly-kids",label:"Mostly kids",icon:"🧒",sub:"Child-focused outing"}]},{id:"availability",label:"When are you available?",hint:"Select all that work for you",type:"multi",options:[{value:"weeknight",label:"Weeknight",icon:"🌙"},{value:"weekend-evening",label:"Weekend evening",icon:"🎉"},{value:"matinee",label:"Weekend matinee",icon:"☀️",sub:"Afternoon show"}]},{id:"budget",label:"How are you thinking about budget?",type:"single",options:[{value:"value",label:"Value-conscious",icon:"💚",sub:"Looking for deals"},{value:"no-preference",label:"No preference",icon:"🎟️",sub:"Price isn't a factor"},{value:"splurge",label:"Special occasion splurge",icon:"✨",sub:"Going all out"}]},{id:"maturity",label:"Comfort with mature themes?",type:"single",options:[{value:"family-safe",label:"Family-safe only",icon:"🌟",sub:"All ages welcome"},{value:"mild",label:"Mild adult content OK",icon:"👍",sub:"Typical PG-13 fare"},{value:"no-preference",label:"No preference",icon:"🎭",sub:"Open to anything"}]}],k="https://api.anthropic.com/v1/messages",g="claude-haiku-4-5-20251001";function y(t,i){const s=JSON.stringify(t,null,2),o=JSON.stringify(i,null,2);return`You are a friendly and knowledgeable show recommender for the Omaha Community Playhouse (OCP), the largest community theatre in the United States, located at 6915 Cass St., Omaha, NE 68132.

Your job is to match the user to the single best show currently playing at OCP based on their preferences, then briefly compare all other current shows.

Current show data:
${s}

User's form answers:
${o}

Guidelines:
- Be warm, enthusiastic, and knowledgeable about live theatre — like a trusted friend who loves theatre
- Ask 1–2 focused follow-up questions before committing to a recommendation
- Keep responses concise and conversational (2–4 sentences unless it's the final pick)
- When the user clicks "Get My Recommendation," the app handles the structured output separately — just continue the friendly conversation here
- If asked about anything unrelated to OCP shows, warmly redirect back to the theatre
- Always encourage attending live theatre`}function S(t,i,s){const o=JSON.stringify(t,null,2),n=JSON.stringify(i,null,2),a=s.map(r=>`${r.role}: ${r.content}`).join(`

`);return`You are a show recommender for the Omaha Community Playhouse. Based on the user's preferences and your conversation, produce a JSON recommendation.

Show data:
${o}

User form answers:
${n}

Conversation history:
${a}

Return ONLY a valid JSON object — no markdown fences, no extra text:
{
  "recommendedShowId": "<id from show data>",
  "reason": "<2–3 warm, personalized sentences explaining why this show is the perfect match>",
  "comparisons": [
    {
      "showId": "<other show id>",
      "note": "<one sentence: who this show would be a better fit for>"
    }
  ]
}`}async function f(t,i){var n,a;const s=await fetch(k,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":t,"anthropic-version":"2023-06-01","anthropic-dangerous-allow-browser":"true"},body:JSON.stringify(i)});if(!s.ok){const r=await s.json().catch(()=>({}));throw new Error(((n=r.error)==null?void 0:n.message)??`API error ${s.status}`)}return((a=(await s.json()).content[0])==null?void 0:a.text)??""}async function b(t,i,s){return f(t,{model:g,max_tokens:512,system:s,messages:i.map(o=>({role:o.role,content:o.content}))})}async function $(t,i,s,o){const n=S(i,s,o),a=await f(t,{model:g,max_tokens:1024,messages:[{role:"user",content:n}]});try{return JSON.parse(a)}catch{const r=a.match(/\{[\s\S]*\}/);if(r)return JSON.parse(r[0]);throw new Error("Could not parse recommendation. Please try again.")}}const e={view:"landing",formStep:0,formAnswers:{},messages:[],shows:_,apiKey:sessionStorage.getItem("ocp_api_key")??"",isLoading:!1,matchResult:null};function d(){const t=document.getElementById("app");switch(e.view){case"landing":t.innerHTML=A();break;case"apikey":t.innerHTML=C();break;case"form":t.innerHTML=x();break;case"chat":t.innerHTML=M();break;case"result":t.innerHTML=E();break}e.isLoading&&t.insertAdjacentHTML("beforeend",L()),P()}function A(){const t=e.shows.filter(s=>s.isCurrentlyRunning),i=e.shows.filter(s=>!s.isCurrentlyRunning);return`
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
          ${t.map(s=>`<span class="landing__show-pill">Now Playing: ${s.title}</span>`).join("")}
          ${i.map(s=>`<span class="landing__show-pill">Coming Soon: ${s.title}</span>`).join("")}
        </div>
      </div>

      <p class="landing__footer-note">Extraordinary Theatre, Crafted Here — Since 1924</p>
    </section>
  `}function C(){return`
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
          This app uses Claude AI to match you with the perfect show.
          Enter your Anthropic API key to get started. It's stored only in
          your browser session and sent exclusively to Anthropic's API.
        </p>

        <div class="input-group">
          <label for="api-key-input">Anthropic API Key</label>
          <input
            type="password"
            id="api-key-input"
            placeholder="sk-ant-..."
            value="${l(e.apiKey)}"
            autocomplete="off"
          />
        </div>

        <button class="btn btn--primary btn--full" id="save-key-btn">
          Continue to Matchmaker
        </button>

        <p class="text-muted mt-16 text-sm text-center">
          Get a key at
          <a href="https://console.anthropic.com" target="_blank" style="color:var(--color-gold)">
            console.anthropic.com
          </a>
        </p>
      </div>
    </div>
  `}function x(){const t=m[e.formStep],i=e.formStep/m.length*100,s=t.type==="multi",o=e.formAnswers[t.id],n=s?o??[]:[o??""],a=s?n.length>0:!!o,r=e.formStep===m.length-1;return`
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
            <div class="progress-bar__fill" style="width:${i}%"></div>
          </div>
          <div class="progress-bar__label">
            <span>${e.formStep+1} of ${m.length}</span>
            <span>${s?"Select all that apply":"Select one"}</span>
          </div>
        </div>

        <div class="form-question">
          <h2 class="form-question__label">${t.label}</h2>
          ${t.hint?`<p class="form-question__hint">${t.hint}</p>`:""}

          <div class="answer-grid">
            ${t.options.map(c=>`
              <button
                class="answer-option${n.includes(c.value)?" selected":""}"
                data-value="${c.value}"
                data-question="${t.id}"
                data-type="${t.type}"
              >
                ${c.icon?`<span class="answer-option__icon">${c.icon}</span>`:""}
                <div>
                  <div class="answer-option__text">${c.label}</div>
                  ${c.sub?`<div class="answer-option__sub">${c.sub}</div>`:""}
                </div>
              </button>
            `).join("")}
          </div>

          <div class="form-nav">
            <button
              class="btn btn--secondary"
              id="prev-btn"
              ${e.formStep===0?'style="visibility:hidden"':""}
            >← Back</button>
            <button
              class="btn btn--primary"
              id="next-btn"
              ${a?"":"disabled"}
            >${r?"Start Chat →":"Next →"}</button>
          </div>
        </div>

      </div>
    </div>
  `}function M(){const t=e.messages.map(o=>`
    <div class="chat-message chat-message--${o.role}">
      <div class="chat-message__avatar">${o.role==="assistant"?"🎭":"👤"}</div>
      <div class="chat-message__bubble">${l(o.content)}</div>
    </div>
  `).join(""),i=e.isLoading?`
    <div class="chat-typing">
      <div class="chat-typing__avatar">🎭</div>
      <div class="chat-typing__dots">
        <div class="chat-typing__dot"></div>
        <div class="chat-typing__dot"></div>
        <div class="chat-typing__dot"></div>
      </div>
    </div>
  `:"",s=e.messages.length>=3&&!e.isLoading;return`
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
        ${t}${i}
      </div>

      <div class="chat-input-area">
        <div class="chat-input-row">
          <textarea
            class="chat-input"
            id="chat-input"
            placeholder="Type your message..."
            rows="1"
            ${e.isLoading?"disabled":""}
          ></textarea>
          <button class="chat-send-btn" id="chat-send" ${e.isLoading?"disabled":""}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M16 9L2 2.5l2.5 6.5L2 15.5 16 9z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        ${s?`
          <button class="btn btn--primary chat-recommend-btn" id="recommend-btn">
            ✦ Get My Show Recommendation
          </button>
        `:""}
      </div>
    </div>
  `}function E(){if(!e.matchResult)return'<p style="padding:120px 24px;text-align:center">No result.</p>';const t=e.shows.find(s=>s.id===e.matchResult.recommendedShowId);if(!t)return'<p style="padding:120px 24px;text-align:center">Show not found.</p>';const i=e.matchResult.comparisons.map(s=>({...s,show:e.shows.find(o=>o.id===s.showId)})).filter(s=>s.show!=null);return`
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
              <div style="font-family:var(--font-serif);font-size:1rem;letter-spacing:0.08em;">${l(t.venue)}</div>
            </div>
          </div>
          <div class="result-hero__overlay"></div>
          <div class="result-hero__content">
            <div class="result-hero__badge">✦ Your Perfect Match</div>
            <h1 class="result-hero__title">${l(t.title)}</h1>
            <p class="result-hero__dates">${l(t.dates)}</p>
          </div>
        </div>

        <!-- Why it's your match -->
        <div class="result-section">
          <p class="result-section__title">Why It's Your Match</p>
          <p class="result-reason">"${l(e.matchResult.reason)}"</p>
        </div>

        <!-- About the show -->
        <div class="result-section">
          <p class="result-section__title">About the Show</p>
          <p class="result-overview">${l(t.description)}</p>

          ${t.contentAdvisory?`
            <div class="tag-list mt-16">
              <span class="tag">⚠ ${l(t.contentAdvisory)}</span>
            </div>
          `:""}

          <div class="info-grid mt-20">
            <div class="info-item">
              <span class="info-item__label">Venue</span>
              <span class="info-item__value">${l(t.venue)}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Capacity</span>
              <span class="info-item__value">${l(t.venueCapacity)}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Dates</span>
              <span class="info-item__value">${l(t.dates)}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Address</span>
              <span class="info-item__value">6915 Cass St., Omaha, NE 68132</span>
            </div>
          </div>

          ${t.genres.length>0?`
            <div class="tag-list mt-16">
              ${t.genres.map(s=>`<span class="tag tag--gold">${l(s)}</span>`).join("")}
            </div>
          `:""}
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
            <a href="${t.ticketUrl}" target="_blank" rel="noopener"
               class="btn btn--primary btn--lg btn--full">
              Buy Tickets for ${l(t.title)} →
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

        ${t.specialEvents.length>0?`
          <div class="result-section">
            <p class="result-section__title">Special Events</p>
            <div class="tag-list">
              ${t.specialEvents.map(s=>`<span class="tag tag--gold">⭐ ${l(s)}</span>`).join("")}
            </div>
          </div>
        `:""}

        ${t.accessibility.length>0?`
          <div class="result-section">
            <p class="result-section__title">Accessibility</p>
            <div class="tag-list">
              ${t.accessibility.map(s=>`<span class="tag">♿ ${l(s)}</span>`).join("")}
            </div>
          </div>
        `:""}

        <!-- What to expect -->
        <div class="result-section">
          <p class="result-section__title">What to Expect</p>
          <p class="result-overview">${l(t.venueDescription)}</p>
          <p class="result-overview mt-16">
            OCP has been producing extraordinary community theatre since 1924.
            Expect high-caliber production values, professional direction, and a warm,
            welcoming atmosphere. Dress is casual to smart casual — come as you are.
          </p>
        </div>

        <!-- Compare other shows -->
        ${i.length>0?`
          <div class="result-section">
            <p class="result-section__title">Also Playing at OCP</p>
            <div class="compare-grid">
              ${i.map(s=>s.show?`
                <div class="compare-card">
                  <h3 class="compare-card__title">${l(s.show.title)}</h3>
                  <p class="compare-card__dates">${l(s.show.dates)}</p>
                  <p class="compare-card__note">${l(s.note)}</p>
                </div>
              `:"").join("")}
            </div>
          </div>
        `:""}

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
  `}function L(){return`
    <div class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Finding your perfect show…</p>
      </div>
    </div>
  `}function P(){var t,i,s,o,n;switch(e.view){case"landing":{(t=document.getElementById("start-btn"))==null||t.addEventListener("click",()=>{e.view=e.apiKey?"form":"apikey",d()});break}case"apikey":{const a=document.getElementById("api-key-input"),r=document.getElementById("save-key-btn"),c=()=>{const u=a.value.trim();u&&(e.apiKey=u,sessionStorage.setItem("ocp_api_key",u),e.view="form",d())};r==null||r.addEventListener("click",c),a==null||a.addEventListener("keydown",u=>{u.key==="Enter"&&c()});break}case"form":{document.querySelectorAll(".answer-option").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.value,c=a.dataset.question;if(a.dataset.type==="multi"){const p=e.formAnswers[c]??[];e.formAnswers[c]=p.includes(r)?p.filter(w=>w!==r):[...p,r],d()}else e.formAnswers[c]=r,d(),setTimeout(()=>{e.formStep<m.length-1?(e.formStep++,d()):h()},320)})}),(i=document.getElementById("next-btn"))==null||i.addEventListener("click",()=>{e.formStep<m.length-1?(e.formStep++,d()):h()}),(s=document.getElementById("prev-btn"))==null||s.addEventListener("click",()=>{e.formStep>0&&(e.formStep--,d())});break}case"chat":{const a=document.getElementById("chat-input"),r=document.getElementById("chat-send");a==null||a.addEventListener("input",()=>{a.style.height="auto",a.style.height=Math.min(a.scrollHeight,120)+"px"}),a==null||a.addEventListener("keydown",c=>{const u=c;u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),v())}),r==null||r.addEventListener("click",()=>void v()),(o=document.getElementById("recommend-btn"))==null||o.addEventListener("click",()=>void O()),T();break}case"result":{(n=document.getElementById("start-over-btn"))==null||n.addEventListener("click",()=>{e.view="landing",e.formStep=0,e.formAnswers={},e.messages=[],e.matchResult=null,d()});break}}}async function h(){e.view="chat",e.messages=[],e.isLoading=!0,d();const t={role:"user",content:"Hi! I've answered some questions about my preferences. Can you help me find the perfect show at OCP?"};e.messages=[t];try{const i=y(e.shows,e.formAnswers),s=await b(e.apiKey,e.messages,i);e.messages=[...e.messages,{role:"assistant",content:s}]}catch(i){e.messages=[...e.messages,{role:"assistant",content:`I'm having trouble connecting right now. Please check your API key and try again. (${i.message})`}]}e.isLoading=!1,d()}async function v(){const t=document.getElementById("chat-input"),i=t==null?void 0:t.value.trim();if(!(!i||e.isLoading)){e.messages=[...e.messages,{role:"user",content:i}],e.isLoading=!0,d();try{const s=y(e.shows,e.formAnswers),o=await b(e.apiKey,e.messages,s);e.messages=[...e.messages,{role:"assistant",content:o}]}catch(s){e.messages=[...e.messages,{role:"assistant",content:`Something went wrong: ${s.message}`}]}e.isLoading=!1,d()}}async function O(){e.isLoading=!0,d();try{const t=await $(e.apiKey,e.shows,e.formAnswers,e.messages);e.matchResult=t,e.view="result"}catch(t){e.messages=[...e.messages,{role:"assistant",content:`I had trouble generating your recommendation. ${t.message} Please try again.`}]}e.isLoading=!1,d()}function T(){requestAnimationFrame(()=>{const t=document.getElementById("chat-messages");t&&(t.scrollTop=t.scrollHeight)})}function l(t){const i=document.createElement("div");return i.appendChild(document.createTextNode(t)),i.innerHTML}d();
