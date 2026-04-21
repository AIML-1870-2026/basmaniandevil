import type { Message, MatchResult, Show } from './types.ts';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export function buildSystemPrompt(
  shows: Show[],
  formAnswers: Record<string, string | string[]>
): string {
  const showData = JSON.stringify(shows, null, 2);
  const answerData = JSON.stringify(formAnswers, null, 2);

  return `You are a friendly and knowledgeable show recommender for the Omaha Community Playhouse (OCP), the largest community theatre in the United States, located at 6915 Cass St., Omaha, NE 68132.

Your job is to match the user to the single best show currently playing at OCP based on their preferences, then briefly compare all other current shows.

Current show data:
${showData}

User's form answers:
${answerData}

Guidelines:
- Be warm, enthusiastic, and knowledgeable about live theatre — like a trusted friend who loves theatre
- Ask 1–2 focused follow-up questions before committing to a recommendation
- Keep responses concise and conversational (2–4 sentences unless it's the final pick)
- When the user clicks "Get My Recommendation," the app handles the structured output separately — just continue the friendly conversation here
- If asked about anything unrelated to OCP shows, warmly redirect back to the theatre
- Always encourage attending live theatre`;
}

function buildRecommendationPrompt(
  shows: Show[],
  formAnswers: Record<string, string | string[]>,
  messages: Message[]
): string {
  const showData = JSON.stringify(shows, null, 2);
  const answerData = JSON.stringify(formAnswers, null, 2);
  const history = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');

  return `You are a show recommender for the Omaha Community Playhouse. Based on the user's preferences and your conversation, produce a JSON recommendation.

Show data:
${showData}

User form answers:
${answerData}

Conversation history:
${history}

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
}`;
}

async function callApi(
  apiKey: string,
  body: Record<string, unknown>
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.text ?? '';
}

export async function sendChatMessage(
  apiKey: string,
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  return callApi(apiKey, {
    model: MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}

export async function getRecommendation(
  apiKey: string,
  shows: Show[],
  formAnswers: Record<string, string | string[]>,
  messages: Message[]
): Promise<MatchResult> {
  const prompt = buildRecommendationPrompt(shows, formAnswers, messages);

  const text = await callApi(apiKey, {
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    return JSON.parse(text) as MatchResult;
  } catch {
    // Strip possible markdown fences Claude occasionally adds
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as MatchResult;
    throw new Error('Could not parse recommendation. Please try again.');
  }
}
