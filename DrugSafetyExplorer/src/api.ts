import type {
  AdverseEventsResponse,
  RecallsResponse,
  LabelResponse,
  DrugSuggestion,
} from './types'

const BASE = 'https://api.fda.gov'

async function fetchFDA<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (res.status === 404) {
    // OpenFDA returns 404 when no results match
    throw new NotFoundError()
  }
  if (!res.ok) {
    throw new Error(`FDA API error: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export class NotFoundError extends Error {
  constructor() {
    super('No results found')
    this.name = 'NotFoundError'
  }
}

export async function fetchSuggestions(query: string): Promise<DrugSuggestion[]> {
  if (!query.trim()) return []
  const url = `${BASE}/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}"&limit=6`
  try {
    const data = await fetchFDA<LabelResponse>(url)
    const names = new Set<string>()
    for (const r of data.results) {
      for (const n of r.openfda.brand_name ?? []) {
        names.add(n)
      }
    }
    return Array.from(names)
      .slice(0, 6)
      .map((name) => ({ name }))
  } catch {
    return []
  }
}

export async function fetchAdverseEvents(drugName: string): Promise<AdverseEventsResponse> {
  const url = `${BASE}/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=10`
  return fetchFDA<AdverseEventsResponse>(url)
}

export async function fetchRecalls(drugName: string): Promise<RecallsResponse> {
  const url = `${BASE}/drug/enforcement.json?search=brand_name:"${encodeURIComponent(drugName)}"&limit=10`
  return fetchFDA<RecallsResponse>(url)
}

export async function fetchLabel(drugName: string): Promise<LabelResponse> {
  const url = `${BASE}/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`
  return fetchFDA<LabelResponse>(url)
}
