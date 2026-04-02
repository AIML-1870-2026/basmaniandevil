import {
  fetchSuggestions,
  fetchAdverseEvents,
  fetchRecalls,
  fetchLabel,
} from './api'
import { showLoading, showNoSelection, renderColumn } from './ui'
import type { AdverseEventsResponse, RecallsResponse, LabelResponse } from './types'

// ── State ───────────────────────────────────────────────────────────────────

const selectedDrug: [string, string] = ['', '']

// ── DOM refs ─────────────────────────────────────────────────────────────────

const inputs = [
  document.getElementById('input-a') as HTMLInputElement,
  document.getElementById('input-b') as HTMLInputElement,
]
const dropdowns = [
  document.getElementById('dropdown-a') as HTMLElement,
  document.getElementById('dropdown-b') as HTMLElement,
]
const columns = [
  document.getElementById('col-a') as HTMLElement,
  document.getElementById('col-b') as HTMLElement,
]
const loadExampleBtn = document.getElementById('load-example') as HTMLButtonElement
const dismissBtn = document.getElementById('dismiss-banner') as HTMLButtonElement
const banner = document.getElementById('disclaimer-banner') as HTMLElement

// ── Disclaimer banner ────────────────────────────────────────────────────────

dismissBtn.addEventListener('click', () => {
  banner.style.display = 'none'
})

// ── Load example ─────────────────────────────────────────────────────────────

loadExampleBtn.addEventListener('click', () => {
  setDrug(0, 'WARFARIN')
  setDrug(1, 'IBUPROFEN')
  inputs[0].value = 'WARFARIN'
  inputs[1].value = 'IBUPROFEN'
})

// ── Autocomplete ─────────────────────────────────────────────────────────────

let debounceTimers: [ReturnType<typeof setTimeout> | null, ReturnType<typeof setTimeout> | null] = [null, null]

inputs.forEach((input, i) => {
  const idx = i as 0 | 1
  input.addEventListener('input', () => {
    const timer = debounceTimers[idx]
    if (timer) clearTimeout(timer)
    debounceTimers[idx] = setTimeout(async () => {
      const q = input.value.trim()
      if (!q) {
        closeDropdown(idx)
        return
      }
      const suggestions = await fetchSuggestions(q)
      renderDropdown(idx, suggestions.map((s) => s.name))
    }, 400)
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown(idx)
  })
})

document.addEventListener('click', (e) => {
  ;([0, 1] as const).forEach((idx) => {
    if (!inputs[idx].contains(e.target as Node) && !dropdowns[idx].contains(e.target as Node)) {
      closeDropdown(idx)
    }
  })
})

function renderDropdown(idx: 0 | 1, names: string[]): void {
  const dd = dropdowns[idx]
  if (names.length === 0) {
    closeDropdown(idx)
    return
  }
  dd.innerHTML = names
    .map((n) => `<li role="option" tabindex="-1">${n}</li>`)
    .join('')
  dd.classList.remove('hidden')
  dd.querySelectorAll<HTMLLIElement>('li').forEach((li) => {
    li.addEventListener('click', () => {
      inputs[idx].value = li.textContent ?? ''
      closeDropdown(idx)
      setDrug(idx, li.textContent ?? '')
    })
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') li.click()
    })
  })
}

function closeDropdown(idx: 0 | 1): void {
  dropdowns[idx].classList.add('hidden')
  dropdowns[idx].innerHTML = ''
}

// ── Drug selection & data loading ─────────────────────────────────────────────

function setDrug(idx: 0 | 1, name: string): void {
  selectedDrug[idx] = name
  loadDrugData(idx, name)
}

async function loadDrugData(idx: number, drugName: string): Promise<void> {
  const col = columns[idx]
  showLoading(col, drugName)

  let adverseEvents: AdverseEventsResponse | null = null
  let adverseErr: unknown = null
  let recalls: RecallsResponse | null = null
  let recallsErr: unknown = null
  let label: LabelResponse | null = null
  let labelErr: unknown = null

  await Promise.allSettled([
    fetchAdverseEvents(drugName).then((d) => (adverseEvents = d)).catch((e) => (adverseErr = e)),
    fetchRecalls(drugName).then((d) => (recalls = d)).catch((e) => (recallsErr = e)),
    fetchLabel(drugName).then((d) => (label = d)).catch((e) => (labelErr = e)),
  ])

  renderColumn(col, { drugName, adverseEvents, adverseErr, recalls, recallsErr, label, labelErr })
}

// ── Initial state ─────────────────────────────────────────────────────────────

showNoSelection(columns[0])
showNoSelection(columns[1])
