import { NextRequest, NextResponse } from "next/server";
import type { ImageAttachment } from "@/types/prediction";

const VALID_SPORTS = [
  "NBA",
  "NFL",
  "NHL",
  "MLB",
  "Soccer",
  "UCL",
  "Euro",
  "Other",
];

async function detectSportWithClaude(
  images: ImageAttachment[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const { Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey });

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  > = [];

  for (const img of images) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mimeType,
        data: img.data,
      },
    });
  }

  content.push({
    type: "text",
    text: `Look at the image(s) and identify which sport is being shown. The image might contain odds, stats, lineups, betting lines, or sports content.

Valid sports are: ${VALID_SPORTS.join(", ")}.

Respond with ONLY a single sport name from the list above. No explanation, no markdown, just the sport name.`,
  });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    messages: [{ role: "user", content }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const response =
    textBlock?.type === "text" ? textBlock.text.trim().toUpperCase() : "";

  // Validate response
  const detectedSport = VALID_SPORTS.find(
    (s) => s.toUpperCase() === response
  );
  if (detectedSport) {
    return detectedSport;
  }

  // Fallback
  return "Other";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images } = body as { images?: ImageAttachment[] };

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const detectedSport = await detectSportWithClaude(images);

    return NextResponse.json({
      sport: detectedSport,
      confidence: "auto",
    });
  } catch (e) {
    console.error("Detect sport API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Detection failed" },
      { status: 500 }
    );
  }
}
