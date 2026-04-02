import type { AdverseEventsResponse, RecallsResponse, LabelResponse } from './types'
import { NotFoundError } from './api'

// ── Loading skeleton ─────────────────────────────────────────────────────────

export function showLoading(col: HTMLElement, drugName: string): void {
  const slot = col.dataset.slot === 'b' ? 'b' : 'a'
  const label = slot === 'a' ? 'Drug A' : 'Drug B'
  col.innerHTML = `
    <div class="drug-column-inner">
      <div class="col-header">
        <div class="col-slot-label">${escHtml(label)}</div>
        <div class="col-drug-name">${escHtml(drugName)}</div>
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
    </div>`
}

export function showNoSelection(col: HTMLElement): void {
  const slot = col.dataset.slot === 'b' ? 'b' : 'a'
  const label = slot === 'a' ? 'Drug A' : 'Drug B'
  col.innerHTML = `
    <div class="drug-column-inner">
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <p>Search for <strong>${escHtml(label)}</strong> above to see results.</p>
      </div>
    </div>`
}

// ── Error helper ─────────────────────────────────────────────────────────────

function errorHTML(drugName: string, err: unknown): string {
  if (err instanceof NotFoundError) {
    return `<div class="inline-error">No data found for "<strong>${escHtml(drugName)}</strong>". Try a generic name (e.g. "ibuprofen" instead of "Advil").</div>`
  }
  return `<div class="inline-error">Failed to load data for "<strong>${escHtml(drugName)}</strong>". Please try again.</div>`
}

// ── Tab content renderers ─────────────────────────────────────────────────────

function renderAdverseEvents(data: AdverseEventsResponse | null, drugName: string, err: unknown): string {
  if (err) return errorHTML(drugName, err)
  if (!data || data.results.length === 0) {
    return `<p class="empty-tab">No adverse event reports found for this drug.</p>`
  }

  const maxCount = data.results[0].count
  const rows = data.results
    .map((r, i) => {
      const pct = maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0
      return `
        <div class="ae-row">
          <span class="ae-rank">${i + 1}</span>
          <div class="ae-body">
            <div class="ae-label">${escHtml(toTitleCase(r.term))}</div>
            <div class="ae-bar-row">
              <div class="ae-bar-track">
                <div class="ae-bar" style="width:${pct}%"></div>
              </div>
              <span class="ae-count">${r.count.toLocaleString()}</span>
            </div>
          </div>
        </div>`
    })
    .join('')

  return `
    <div class="ae-list">${rows}</div>
    <p class="disclaimer-note">Report counts reflect voluntary submissions and do not indicate how common these events actually are.</p>`
}

const RECALL_CLASS: Record<string, { badge: string; card: string }> = {
  'Class I':   { badge: 'badge-red',    card: 'class-i' },
  'Class II':  { badge: 'badge-orange', card: 'class-ii' },
  'Class III': { badge: 'badge-yellow', card: 'class-iii' },
}

function renderRecalls(data: RecallsResponse | null, drugName: string, err: unknown): string {
  if (err instanceof NotFoundError) {
    return `<p class="empty-tab">No recall records found for this drug.</p>`
  }
  if (err) return errorHTML(drugName, err)
  if (!data || data.results.length === 0) {
    return `<p class="empty-tab">No recall records found for this drug.</p>`
  }

  const items = data.results
    .map((r) => {
      const cls = RECALL_CLASS[r.classification] ?? { badge: 'badge-yellow', card: 'class-iii' }
      return `
        <div class="recall-card ${cls.card}">
          <div class="recall-header">
            <span class="badge ${cls.badge}">${escHtml(r.classification)}</span>
            <span class="recall-date">${formatDate(r.recall_initiation_date)}</span>
          </div>
          <p class="recall-reason">${escHtml(r.reason_for_recall)}</p>
          <p class="recall-firm">Recalling firm: <strong>${escHtml(r.recalling_firm)}</strong></p>
        </div>`
    })
    .join('')

  return `<div class="recall-list">${items}</div>`
}

function renderLabel(data: LabelResponse | null, drugName: string, err: unknown): string {
  if (err) return errorHTML(drugName, err)
  const r = data?.results?.[0]
  if (!r) return `<p class="empty-tab">No label information found for this drug.</p>`

  const sections: Array<{ label: string; field: string[] | undefined }> = [
    { label: 'Warnings', field: r.warnings },
    { label: 'Drug Interactions', field: r.drug_interactions },
    { label: 'Contraindications', field: r.contraindications },
    { label: 'Indications and Usage', field: r.indications_and_usage },
  ]

  const rendered = sections
    .filter((s) => s.field && s.field.length > 0)
    .map((s) => collapsibleSection(s.label, (s.field as string[]).join(' ')))
    .join('')

  if (!rendered) return `<p class="empty-tab">No label information found for this drug.</p>`
  return rendered
}

function collapsibleSection(title: string, text: string): string {
  const isLong = text.length > 300
  const preview = isLong ? escHtml(text.slice(0, 300)) + '…' : escHtml(text)
  const full = escHtml(text)
  const id = `toggle-${Math.random().toString(36).slice(2)}`

  return `
    <div class="label-section">
      <h4>${escHtml(title)}</h4>
      <p class="label-text" id="${id}-short">${preview}</p>
      ${isLong
        ? `<p class="label-text label-text-full hidden" id="${id}-full">${full}</p>
           <button class="show-more-btn" data-short="${id}-short" data-full="${id}-full">Show more</button>`
        : ''}
    </div>`
}

// ── Column builder ────────────────────────────────────────────────────────────

interface ColData {
  drugName: string
  adverseEvents: AdverseEventsResponse | null
  adverseErr: unknown
  recalls: RecallsResponse | null
  recallsErr: unknown
  label: LabelResponse | null
  labelErr: unknown
}

export function renderColumn(col: HTMLElement, data: ColData): void {
  const slot = col.dataset.slot === 'b' ? 'b' : 'a'
  const slotLabel = slot === 'a' ? 'Drug A' : 'Drug B'

  const tabs = [
    { id: 'adverse', label: 'Adverse Events', content: renderAdverseEvents(data.adverseEvents, data.drugName, data.adverseErr) },
    { id: 'recalls', label: 'Recalls',        content: renderRecalls(data.recalls, data.drugName, data.recallsErr) },
    { id: 'label',   label: 'Label Info',     content: renderLabel(data.label, data.drugName, data.labelErr) },
  ]

  col.innerHTML = `
    <div class="drug-column-inner">
      <div class="col-header">
        <div class="col-slot-label">${escHtml(slotLabel)}</div>
        <div class="col-drug-name">${escHtml(toTitleCase(data.drugName))}</div>
      </div>
      <div class="tab-bar" role="tablist">
        ${tabs.map((t, i) => `
          <button
            class="tab-btn${i === 0 ? ' active' : ''}"
            role="tab"
            aria-selected="${i === 0}"
            data-tab="${t.id}"
          >${t.label}</button>`).join('')}
      </div>
      ${tabs.map((t, i) => `
        <div class="tab-panel${i === 0 ? ' active' : ''}" id="panel-${t.id}" role="tabpanel">
          ${t.content}
        </div>`).join('')}
    </div>`

  // Tab switching
  col.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      col.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.remove('active')
        b.setAttribute('aria-selected', 'false')
      })
      col.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'))
      btn.classList.add('active')
      btn.setAttribute('aria-selected', 'true')
      col.querySelector(`#panel-${btn.dataset.tab}`)?.classList.add('active')
    })
  })

  // Show more toggles
  col.querySelectorAll<HTMLButtonElement>('.show-more-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const shortEl = col.querySelector<HTMLElement>(`#${btn.dataset.short}`)
      const fullEl  = col.querySelector<HTMLElement>(`#${btn.dataset.full}`)
      if (!shortEl || !fullEl) return
      const expanded = !fullEl.classList.contains('hidden')
      if (expanded) {
        fullEl.classList.add('hidden')
        shortEl.classList.remove('hidden')
        btn.textContent = 'Show more'
      } else {
        fullEl.classList.remove('hidden')
        shortEl.classList.add('hidden')
        btn.textContent = 'Show less'
      }
    })
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(raw: string): string {
  if (!raw || raw.length !== 8) return raw
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
