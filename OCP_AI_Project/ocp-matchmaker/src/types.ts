export interface Show {
  id: string;
  title: string;
  dates: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueCapacity: string;
  venueDescription: string;
  description: string;
  contentAdvisory: string;
  ticketUrl: string;
  imageUrl: string;
  specialEvents: string[];
  accessibility: string[];
  genres: string[];
  ageRating: 'all-ages' | 'family' | 'adult';
  isCurrentlyRunning: boolean;
}

export interface FormOption {
  value: string;
  label: string;
  icon?: string;
  sub?: string;
}

export interface FormQuestion {
  id: string;
  label: string;
  hint?: string;
  type: 'single' | 'multi';
  options: FormOption[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface MatchResult {
  recommendedShowId: string;
  reason: string;
  comparisons: Array<{
    showId: string;
    note: string;
  }>;
}

export type AppView = 'landing' | 'apikey' | 'form' | 'chat' | 'result';

export interface AppState {
  view: AppView;
  formStep: number;
  formAnswers: Record<string, string | string[]>;
  messages: Message[];
  shows: Show[];
  apiKey: string;
  isLoading: boolean;
  matchResult: MatchResult | null;
}
