import { GoogleGenAI } from "@google/genai";
import { TaxStrategy } from "../types";
import { STATE_TAX } from "../taxData2024";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface NarrativeParams {
  marginalRateLabel: string;   // e.g. "37%"
  stateName: string;           // e.g. "California"
  filingStatusLabel: string;   // e.g. "married filing jointly"
  hasRsuIncome: boolean;
  strategies: Pick<TaxStrategy, 'id' | 'title'>[];
}

const FILING_STATUS_LABELS: Record<string, string> = {
  single: 'single filer',
  mfj:    'married filing jointly',
  mfs:    'married filing separately',
  hoh:    'head of household',
};

// Sanitize a string to prevent prompt injection — strips characters that could
// alter prompt structure while preserving normal text.
function sanitize(value: string): string {
  return value.replace(/[`<>{}[\]]/g, '').slice(0, 100);
}

export async function generateNarratives(
  stateCode: string,
  marginalRateLabel: string,
  filingStatus: string,
  hasRsuIncome: boolean,
  strategies: Pick<TaxStrategy, 'id' | 'title'>[],
): Promise<Record<string, string>> {
  const stateName = sanitize(STATE_TAX[stateCode]?.name ?? stateCode);
  const filingStatusLabel = sanitize(FILING_STATUS_LABELS[filingStatus] ?? filingStatus);
  const safeRateLabel = sanitize(marginalRateLabel);

  // NOTE: We deliberately do NOT include raw dollar figures from user input in
  // this prompt. Only abstracted parameters (bracket tier, state name, strategy
  // names) are sent to the external API to protect user privacy.
  const strategyList = strategies
    .map(s => `- ${sanitize(s.title)} (id: ${sanitize(s.id)})`)
    .join('\n');

  const prompt = `You are a knowledgeable tax educator helping a high-income ${filingStatusLabel} in ${stateName} who is in the ${safeRateLabel} federal tax bracket${hasRsuIncome ? ' with RSU equity compensation' : ''}.

For each tax strategy listed below, write a concise 2–3 sentence personalized explanation of WHY this strategy is especially valuable for someone in their situation. Use plain English, not jargon. Do NOT invent specific dollar figures or guarantee outcomes. Do NOT provide legal or tax advice — frame everything as educational information.

Strategies:
${strategyList}

Respond with a JSON object where each key is the strategy id and the value is the 2–3 sentence explanation. Example format:
{
  "401k-optimization": "At the 37% bracket, every dollar you defer into a 401(k)...",
  "backdoor-roth": "Since your income exceeds..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');

    const parsed = JSON.parse(text) as Record<string, string>;
    return parsed;
  } catch (err) {
    console.error('Gemini narrative generation failed:', err);
    // Non-fatal: return empty object so UI falls back to static descriptions
    return {};
  }
}
