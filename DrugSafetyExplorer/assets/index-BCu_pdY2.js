(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))l(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&l(o)}).observe(document,{childList:!0,subtree:!0});function r(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function l(n){if(n.ep)return;n.ep=!0;const s=r(n);fetch(n.href,s)}})();const v="https://api.fda.gov";async function p(e){const t=await fetch(e);if(t.status===404)throw new m;if(!t.ok)throw new Error(`FDA API error: ${t.status}`);return t.json()}class m extends Error{constructor(){super("No results found"),this.name="NotFoundError"}}async function L(e){if(!e.trim())return[];const t=`${v}/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(e)}"&limit=6`;try{const r=await p(t),l=new Set;for(const n of r.results)for(const s of n.openfda.brand_name??[])l.add(s);return Array.from(l).slice(0,6).map(n=>({name:n}))}catch{return[]}}async function I(e){const t=`${v}/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(e)}"&count=patient.reaction.reactionmeddrapt.exact&limit=10`;return p(t)}async function A(e){const t=`${v}/drug/enforcement.json?search=brand_name:"${encodeURIComponent(e)}"&limit=10`;return p(t)}async function k(e){const t=`${v}/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(e)}"&limit=1`;return p(t)}function x(e,t){const l=(e.dataset.slot==="b"?"b":"a")==="a"?"Drug A":"Drug B";e.innerHTML=`
    <div class="drug-column-inner">
      <div class="col-header">
        <div class="col-slot-label">${i(l)}</div>
        <div class="col-drug-name">${i(t)}</div>
      </div>
      <div class="loading-state">
        <div class="skeleton-tabs">
          <div class="skel" style="height:28px;width:90px;border-radius:999px"></div>
          <div class="skel" style="height:28px;width:60px;border-radius:999px"></div>
          <div class="skel" style="height:28px;width:70px;border-radius:999px"></div>
        </div>
        <div class="skeleton-content">
          <div class="skel" style="height:12px;width:60%"></div>
          <div class="skel" style="height:12px;width:90%"></div>
          <div class="skel" style="height:12px;width:75%"></div>
          <div class="skel" style="height:12px;width:85%"></div>
          <div class="skel" style="height:12px;width:55%"></div>
          <div class="skel" style="height:12px;width:80%"></div>
        </div>
      </div>
    </div>`}function E(e){const r=(e.dataset.slot==="b"?"b":"a")==="a"?"Drug A":"Drug B";e.innerHTML=`
    <div class="drug-column-inner">
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <p>Search for <strong>${i(r)}</strong> above to see results.</p>
      </div>
    </div>`}function b(e,t){return t instanceof m?`<div class="inline-error">No data found for "<strong>${i(e)}</strong>". Try a generic name (e.g. "ibuprofen" instead of "Advil").</div>`:`<div class="inline-error">Failed to load data for "<strong>${i(e)}</strong>". Please try again.</div>`}function S(e,t,r){if(r)return b(t,r);if(!e||e.results.length===0)return'<p class="empty-tab">No adverse event reports found for this drug.</p>';const l=e.results[0].count;return`
    <div class="ae-list">${e.results.map((s,o)=>{const a=l>0?Math.round(s.count/l*100):0;return`
        <div class="ae-row">
          <span class="ae-rank">${o+1}</span>
          <div class="ae-body">
            <div class="ae-label">${i(w(s.term))}</div>
            <div class="ae-bar-row">
              <div class="ae-bar-track">
                <div class="ae-bar" style="width:${a}%"></div>
              </div>
              <span class="ae-count">${s.count.toLocaleString()}</span>
            </div>
          </div>
        </div>`}).join("")}</div>
    <p class="disclaimer-note">Report counts reflect voluntary submissions and do not indicate how common these events actually are.</p>`}const C={"Class I":{badge:"badge-red",card:"class-i"},"Class II":{badge:"badge-orange",card:"class-ii"},"Class III":{badge:"badge-yellow",card:"class-iii"}};function B(e,t,r){return r instanceof m?'<p class="empty-tab">No recall records found for this drug.</p>':r?b(t,r):!e||e.results.length===0?'<p class="empty-tab">No recall records found for this drug.</p>':`<div class="recall-list">${e.results.map(n=>{const s=C[n.classification]??{badge:"badge-yellow",card:"class-iii"};return`
        <div class="recall-card ${s.card}">
          <div class="recall-header">
            <span class="badge ${s.badge}">${i(n.classification)}</span>
            <span class="recall-date">${j(n.recall_initiation_date)}</span>
          </div>
          <p class="recall-reason">${i(n.reason_for_recall)}</p>
          <p class="recall-firm">Recalling firm: <strong>${i(n.recalling_firm)}</strong></p>
        </div>`}).join("")}</div>`}function D(e,t,r){var o;if(r)return b(t,r);const l=(o=e==null?void 0:e.results)==null?void 0:o[0];if(!l)return'<p class="empty-tab">No label information found for this drug.</p>';const s=[{label:"Warnings",field:l.warnings},{label:"Drug Interactions",field:l.drug_interactions},{label:"Contraindications",field:l.contraindications},{label:"Indications and Usage",field:l.indications_and_usage}].filter(a=>a.field&&a.field.length>0).map(a=>N(a.label,a.field.join(" "))).join("");return s||'<p class="empty-tab">No label information found for this drug.</p>'}function N(e,t){const r=t.length>300,l=r?i(t.slice(0,300))+"…":i(t),n=i(t),s=`toggle-${Math.random().toString(36).slice(2)}`;return`
    <div class="label-section">
      <h4>${i(e)}</h4>
      <p class="label-text" id="${s}-short">${l}</p>
      ${r?`<p class="label-text label-text-full hidden" id="${s}-full">${n}</p>
           <button class="show-more-btn" data-short="${s}-short" data-full="${s}-full">Show more</button>`:""}
    </div>`}function R(e,t){const l=(e.dataset.slot==="b"?"b":"a")==="a"?"Drug A":"Drug B",n=[{id:"adverse",label:"Adverse Events",content:S(t.adverseEvents,t.drugName,t.adverseErr)},{id:"recalls",label:"Recalls",content:B(t.recalls,t.drugName,t.recallsErr)},{id:"label",label:"Label Info",content:D(t.label,t.drugName,t.labelErr)}];e.innerHTML=`
    <div class="drug-column-inner">
      <div class="col-header">
        <div class="col-slot-label">${i(l)}</div>
        <div class="col-drug-name">${i(w(t.drugName))}</div>
      </div>
      <div class="tab-bar" role="tablist">
        ${n.map((s,o)=>`
          <button
            class="tab-btn${o===0?" active":""}"
            role="tab"
            aria-selected="${o===0}"
            data-tab="${s.id}"
          >${s.label}</button>`).join("")}
      </div>
      ${n.map((s,o)=>`
        <div class="tab-panel${o===0?" active":""}" id="panel-${s.id}" role="tabpanel">
          ${s.content}
        </div>`).join("")}
    </div>`,e.querySelectorAll(".tab-btn").forEach(s=>{s.addEventListener("click",()=>{var o;e.querySelectorAll(".tab-btn").forEach(a=>{a.classList.remove("active"),a.setAttribute("aria-selected","false")}),e.querySelectorAll(".tab-panel").forEach(a=>a.classList.remove("active")),s.classList.add("active"),s.setAttribute("aria-selected","true"),(o=e.querySelector(`#panel-${s.dataset.tab}`))==null||o.classList.add("active")})}),e.querySelectorAll(".show-more-btn").forEach(s=>{s.addEventListener("click",()=>{const o=e.querySelector(`#${s.dataset.short}`),a=e.querySelector(`#${s.dataset.full}`);if(!o||!a)return;!a.classList.contains("hidden")?(a.classList.add("hidden"),o.classList.remove("hidden"),s.textContent="Show more"):(a.classList.remove("hidden"),o.classList.add("hidden"),s.textContent="Show less")})})}function i(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function j(e){return!e||e.length!==8?e:`${e.slice(0,4)}-${e.slice(4,6)}-${e.slice(6,8)}`}function w(e){return e.toLowerCase().replace(/\b\w/g,t=>t.toUpperCase())}const _=["",""],d=[document.getElementById("input-a"),document.getElementById("input-b")],f=[document.getElementById("dropdown-a"),document.getElementById("dropdown-b")],y=[document.getElementById("col-a"),document.getElementById("col-b")],T=document.getElementById("load-example"),q=document.getElementById("dismiss-banner"),F=document.getElementById("disclaimer-banner");q.addEventListener("click",()=>{F.style.display="none"});T.addEventListener("click",()=>{h(0,"WARFARIN"),h(1,"IBUPROFEN"),d[0].value="WARFARIN",d[1].value="IBUPROFEN"});let $=[null,null];d.forEach((e,t)=>{const r=t;e.addEventListener("input",()=>{const l=$[r];l&&clearTimeout(l),$[r]=setTimeout(async()=>{const n=e.value.trim();if(!n){u(r);return}const s=await L(n);M(r,s.map(o=>o.name))},400)}),e.addEventListener("keydown",l=>{l.key==="Escape"&&u(r)})});document.addEventListener("click",e=>{[0,1].forEach(t=>{!d[t].contains(e.target)&&!f[t].contains(e.target)&&u(t)})});function M(e,t){const r=f[e];if(t.length===0){u(e);return}r.innerHTML=t.map(l=>`<li role="option" tabindex="-1">${l}</li>`).join(""),r.classList.remove("hidden"),r.querySelectorAll("li").forEach(l=>{l.addEventListener("click",()=>{d[e].value=l.textContent??"",u(e),h(e,l.textContent??"")}),l.addEventListener("keydown",n=>{n.key==="Enter"&&l.click()})})}function u(e){f[e].classList.add("hidden"),f[e].innerHTML=""}function h(e,t){_[e]=t,P(e,t)}async function P(e,t){const r=y[e];x(r,t);let l=null,n=null,s=null,o=null,a=null,g=null;await Promise.allSettled([I(t).then(c=>l=c).catch(c=>n=c),A(t).then(c=>s=c).catch(c=>o=c),k(t).then(c=>a=c).catch(c=>g=c)]),R(r,{drugName:t,adverseEvents:l,adverseErr:n,recalls:s,recallsErr:o,label:a,labelErr:g})}E(y[0]);E(y[1]);
