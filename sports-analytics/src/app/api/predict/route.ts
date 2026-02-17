import { NextRequest, NextResponse } from "next/server";
import { providers } from "@/lib/ai/providers";
import type { AIModel, BetType, ImageAttachment } from "@/types/prediction";

const GUEST_LIMIT = 10;
const USER_LIMIT = 50;

async function getSupabaseClient() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    return await createClient();
  } catch {
    return null;
  }
}

async function getPredictionCount(userId: string | null): Promise<number> {
  const supabase = await getSupabaseClient();
  if (!supabase) return 0;

  const today = new Date().toISOString().split("T")[0];

  const { count } = userId
    ? await supabase
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00`)
    : await supabase
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .is("user_id", null)
        .gte("created_at", `${today}T00:00:00`);

  return count ?? 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      sport = "NBA",
      bet_type = "Moneyline",
      odds,
      models = ["grok"],
      thinkHarder = false,
      saveToNotebookId,
      images,
    } = body as {
      prompt: string;
      sport?: string;
      bet_type?: BetType;
      odds?: number;
      models?: AIModel[];
      thinkHarder?: boolean;
      saveToNotebookId?: string;
      images?: ImageAttachment[];
    };

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    let user: { id: string } | null = null;
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    const count = await getPredictionCount(user?.id ?? null);
    const limit = user ? USER_LIMIT : GUEST_LIMIT;
    if (count >= limit) {
      return NextResponse.json(
        {
          error: "Daily prediction limit reached. Create an account to save and increase limits.",
          limit,
        },
        { status: 429 }
      );
    }

    const input = {
      sport,
      event: "",
      bet_type,
      odds,
      prompt: prompt.trim(),
      thinkHarder,
      images: images && images.length > 0 ? images : undefined,
    };

    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    for (const modelId of models) {
      const provider = providers[modelId];
      if (!provider) {
        errors[modelId] = `Unknown model: ${modelId}`;
        continue;
      }
      try {
        const result = await provider.generatePrediction(input);
        results[modelId] = result;
      } catch (e) {
        errors[modelId] = e instanceof Error ? e.message : "Unknown error";
      }
    }

    const primaryResult = results[models[0]];
    if (!primaryResult) {
      return NextResponse.json(
        { error: errors[models[0]] ?? "Prediction failed" },
        { status: 500 }
      );
    }

    if (user && supabase && primaryResult) {
      await supabase.from("predictions").insert({
        user_id: user.id,
        notebook_id: saveToNotebookId || null,
        prompt: input.prompt,
        sport: input.sport,
        bet_type: input.bet_type,
        models_used: models,
        result_json: primaryResult,
      });
    }

    return NextResponse.json({
      results,
      odds: odds ?? undefined,
      errors: Object.keys(errors).length ? errors : undefined,
    });
  } catch (e) {
    console.error("Predict API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
