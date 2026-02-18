"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import type { AIModel, BetType, ImageAttachment } from "@/types/prediction";

const SPORTS = ["NBA", "NFL", "NHL", "MLB", "Soccer", "UCL", "Euro", "Other"];
const BET_TYPES: BetType[] = ["Moneyline", "Spread", "Over/Under", "Parlay"];
const MODELS: { id: AIModel; label: string }[] = [
  { id: "grok", label: "Grok" },
  { id: "gpt", label: "GPT" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
];

interface Notebook {
  id: string;
  name: string;
  sport: string | null;
}

interface PredictionFormProps {
  onResult: (data: unknown) => void;
  onError: (msg: string) => void;
  canSave?: boolean;
  notebooks?: Notebook[];
}

export function PredictionForm({
  onResult,
  onError,
  canSave = false,
  notebooks = [],
}: PredictionFormProps) {
  const [prompt, setPrompt] = useState("");
  const [sport, setSport] = useState("NBA");
  const [betType, setBetType] = useState<BetType>("Moneyline");
  const [odds, setOdds] = useState("");
  const [model, setModel] = useState<AIModel>("grok");
  const [compareMode, setCompareMode] = useState(false);
  const [thinkHarder, setThinkHarder] = useState(false);
  const [saveToNotebook, setSaveToNotebook] = useState<string>("__none__");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedSport, setDetectedSport] = useState<string | null>(null);

  // Auto-detect sport from images
  useEffect(() => {
    if (images.length > 0 && !detecting) {
      setDetecting(true);
      fetch("/api/detect-sport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sport && data.sport !== "Other") {
            setSport(data.sport);
            setDetectedSport(data.sport);
          }
          setDetecting(false);
        })
        .catch((err) => {
          console.error("Sport detection error:", err);
          setDetecting(false);
        });
    } else if (images.length === 0) {
      setDetectedSport(null);
    }
  }, [images, detecting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      onError("Enter a betting question");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const modelsToUse: AIModel[] = compareMode
        ? ["grok", "gpt", "claude", "gemini"]
        : [model];

      const oddsNum = odds ? parseInt(odds, 10) : undefined;
      const saveToNotebookId =
        notebooks.length > 0 && saveToNotebook && saveToNotebook !== "__none__"
          ? saveToNotebook
          : undefined;

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          sport,
          bet_type: betType,
          odds: oddsNum,
          models: modelsToUse,
          thinkHarder,
          saveToNotebookId: saveToNotebookId || undefined,
          images: images.length > 0 ? images : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error || "Prediction failed");
        return;
      }

      onResult({ ...data, odds: oddsNum ?? data.odds });
      setImages([]);
    } catch {
      onError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="prompt" className="text-muted-foreground">
              Your betting question
            </Label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Who wins Hornets vs Pistons tonight? Should I take the over?"
              className="mt-2 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            />
          </div>

          <div>
            <ImageUpload
              images={images}
              onChange={setImages}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Sport</Label>
                {detecting && (
                  <span className="text-xs text-amber-600 font-medium">
                    Detecting…
                  </span>
                )}
                {detectedSport && !detecting && (
                  <span className="text-xs text-green-600 font-medium">
                    Auto-detected
                  </span>
                )}
              </div>
              <Select value={sport} onValueChange={setSport} disabled={detecting}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Bet type</Label>
              <Select value={betType} onValueChange={(v) => setBetType(v as BetType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BET_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="odds" className="text-muted-foreground">
                American odds (optional)
              </Label>
              <Input
                id="odds"
                type="number"
                placeholder="e.g. -110"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Model</Label>
              <Select
                value={model}
                onValueChange={(v) => setModel(v as AIModel)}
                disabled={compareMode}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {canSave && notebooks.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Save to notebook</Label>
              <Select
                value={saveToNotebook || "__none__"}
                onValueChange={setSaveToNotebook}
                disabled={loading}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="None (don't save)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {notebooks.map((nb) => (
                    <SelectItem key={nb.id} value={nb.id}>
                      {nb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={compareMode}
                onCheckedChange={(c) => setCompareMode(!!c)}
                disabled={loading}
              />
              <span className="text-sm text-muted-foreground">
                Compare models
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={thinkHarder}
                onCheckedChange={(c) => setThinkHarder(!!c)}
                disabled={loading}
              />
              <span className="text-sm text-muted-foreground">
                Think harder
              </span>
            </label>
          </div>

          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Analyzing…" : "Get probability"}
          </Button>

          {!canSave && (
            <p className="text-xs text-muted-foreground text-center">
              Create an account to save predictions and increase limits.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
