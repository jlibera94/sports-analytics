import type {
  AIProvider,
  ImageAttachment,
  PredictionInput,
  PredictionResult,
} from "@/types/prediction";

const PREDICTION_SCHEMA = `
You must respond with ONLY valid JSON in this exact format. No markdown, no explanation outside JSON.
{
  "sport": "string - e.g. NBA, NFL",
  "event": "string - teams/event name",
  "bet_type": "string - Moneyline, Spread, Over/Under, or Parlay",
  "bet": "string - the specific bet e.g. Hornets +2.5",
  "probability": number between 0 and 1,
  "confidence": "low" | "medium" | "high",
  "edge": number between -1 and 1,
  "recommended_units": number between 0 and 2,
  "explanation": "3-6 sentences max, betting focused. No sources. No guarantees.",
  "key_factors": ["factor1", "factor2", "factor3"]
}

RULES: Sports betting only. Output only JSON. Short explanations. No source mentions (no SofaScore, etc). No guarantees. probability must be 0-1. confidence only: low|medium|high.
`;

const GROK_THINK_HARDER = `
When thinkHarder is true: incorporate injuries, form, H2H, schedule, rest, lineup news.
Return best-calibrated probability. Be thorough.
`;

function buildUserMessageContent(
  userPrompt: string,
  images?: ImageAttachment[]
): string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> {
  if (!images?.length) return userPrompt;
  const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: userPrompt },
  ];
  for (const img of images) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.data}` },
    });
  }
  return parts;
}

async function callOpenAICompatibleAPI(
  baseURL: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.3,
  images?: ImageAttachment[]
): Promise<PredictionResult> {
  const userContent = buildUserMessageContent(userPrompt, images);

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");

  let parsed: PredictionResult;
  try {
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(jsonStr) as PredictionResult;
  } catch {
    throw new Error(`Invalid JSON from AI: ${content.slice(0, 200)}`);
  }

  if (parsed.probability < 0 || parsed.probability > 1) {
    parsed.probability = Math.max(0, Math.min(1, parsed.probability));
  }
  if (!["low", "medium", "high"].includes(parsed.confidence)) {
    parsed.confidence = "medium";
  }

  return parsed;
}

function buildUserPrompt(input: PredictionInput): string {
  let prompt = `Sport: ${input.sport}\nEvent: ${input.event}\nBet type: ${input.bet_type}\n\n${input.prompt}`;
  if (input.odds) prompt += `\n\nAmerican odds provided: ${input.odds}`;
  if (input.thinkHarder) prompt += "\n\n[Think harder: use live context, injuries, form, H2H, rest, lineups]";
  return prompt;
}

export const grokProvider: AIProvider = {
  name: "Grok",
  id: "grok",
  async generatePrediction(input: PredictionInput): Promise<PredictionResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY not configured");

    const systemPrompt = PREDICTION_SCHEMA + (input.thinkHarder ? GROK_THINK_HARDER : "");
    const userPrompt = buildUserPrompt(input);

    return callOpenAICompatibleAPI(
      "https://api.x.ai/v1",
      apiKey,
      input.thinkHarder ? "grok-3-mini-1212" : "grok-3-mini-1212",
      systemPrompt,
      userPrompt,
      input.thinkHarder ? 0.2 : 0.3,
      input.images
    );
  },
};

export const gptProvider: AIProvider = {
  name: "GPT",
  id: "gpt",
  async generatePrediction(input: PredictionInput): Promise<PredictionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const systemPrompt = PREDICTION_SCHEMA;
    const userPrompt = buildUserPrompt(input);

    return callOpenAICompatibleAPI(
      "https://api.openai.com/v1",
      apiKey,
      "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      0.3,
      input.images
    );
  },
};

export const claudeProvider: AIProvider = {
  name: "Claude",
  id: "claude",
  async generatePrediction(input: PredictionInput): Promise<PredictionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const userPrompt = buildUserPrompt(input);
    const systemPrompt = PREDICTION_SCHEMA;

    const content: Array<{ type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];

    if (input.images?.length) {
      for (const img of input.images) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mimeType,
            data: img.data,
          },
        });
      }
    }
    content.push({ type: "text", text: userPrompt });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const content = textBlock?.type === "text" ? textBlock.text.trim() : "";
    if (!content) throw new Error("Empty Claude response");

    let parsed: PredictionResult;
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(jsonStr) as PredictionResult;
    } catch {
      throw new Error(`Invalid JSON from Claude: ${content.slice(0, 200)}`);
    }

    if (parsed.probability < 0 || parsed.probability > 1) {
      parsed.probability = Math.max(0, Math.min(1, parsed.probability));
    }
    if (!["low", "medium", "high"].includes(parsed.confidence)) {
      parsed.confidence = "medium";
    }

    return parsed;
  },
};

export const geminiProvider: AIProvider = {
  name: "Gemini",
  id: "gemini",
  async generatePrediction(input: PredictionInput): Promise<PredictionResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const userPrompt = buildUserPrompt(input);
    const fullPrompt = `${PREDICTION_SCHEMA}\n\n---\n\n${userPrompt}`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (input.images?.length) {
      for (const img of input.images) {
        parts.push({
          inlineData: { mimeType: img.mimeType, data: img.data },
        });
      }
    }
    parts.push({ text: fullPrompt });

    const result = await model.generateContent(parts);
    const response = result.response;
    const content = response.text()?.trim();
    if (!content) throw new Error("Empty Gemini response");

    let parsed: PredictionResult;
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(jsonStr) as PredictionResult;
    } catch {
      throw new Error(`Invalid JSON from Gemini: ${content.slice(0, 200)}`);
    }

    if (parsed.probability < 0 || parsed.probability > 1) {
      parsed.probability = Math.max(0, Math.min(1, parsed.probability));
    }
    if (!["low", "medium", "high"].includes(parsed.confidence)) {
      parsed.confidence = "medium";
    }

    return parsed;
  },
};

export const providers: Record<string, AIProvider> = {
  grok: grokProvider,
  gpt: gptProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
};
