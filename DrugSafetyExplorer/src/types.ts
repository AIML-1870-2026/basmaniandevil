export interface FDAMeta {
  disclaimer: string
  terms: string
  license: string
  last_updated: string
  results: {
    skip: number
    limit: number
    total: number
  }
}

// Adverse events
export interface AdverseEventCount {
  term: string
  count: number
}

export interface AdverseEventsResponse {
  meta: FDAMeta
  results: AdverseEventCount[]
}

// Recalls / enforcement
export interface RecallResult {
  recall_initiation_date: string
  reason_for_recall: string
  classification: 'Class I' | 'Class II' | 'Class III'
  recalling_firm: string
  brand_name: string
  product_description: string
  status: string
}

export interface RecallsResponse {
  meta: FDAMeta
  results: RecallResult[]
}

// Label info
export interface LabelOpenFDA {
  brand_name?: string[]
  generic_name?: string[]
  manufacturer_name?: string[]
}

export interface LabelResult {
  openfda: LabelOpenFDA
  warnings?: string[]
  drug_interactions?: string[]
  contraindications?: string[]
  indications_and_usage?: string[]
}

export interface LabelResponse {
  meta: FDAMeta
  results: LabelResult[]
}

// Autocomplete suggestion
export interface DrugSuggestion {
  name: string
}
