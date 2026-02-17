export type BetType = "Moneyline" | "Spread" | "Over/Under" | "Parlay";
export type Confidence = "low" | "medium" | "high";
export type AIModel = "grok" | "gpt" | "claude" | "gemini";

export interface PredictionResult {
  sport: string;
  event: string;
  bet_type: BetType;
  bet: string;
  probability: number;
  confidence: Confidence;
  edge: number;
  recommended_units: number;
  explanation: string;
  key_factors: string[];
}

/** Base64 image: { data: "base64...", mimeType: "image/jpeg" } */
export interface ImageAttachment {
  data: string;
  mimeType: string;
}

export interface PredictionInput {
  sport: string;
  event: string;
  bet_type: BetType;
  odds?: number;
  prompt: string;
  thinkHarder: boolean;
  images?: ImageAttachment[];
}

export interface AIProvider {
  name: string;
  id: AIModel;
  generatePrediction(input: PredictionInput): Promise<PredictionResult>;
}
