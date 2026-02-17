"use client";

import { useState } from "react";
import { PredictionForm } from "@/components/prediction-form";
import { PredictionResultDisplay } from "@/components/prediction-result";
import type { PredictionResult } from "@/types/prediction";

interface HomepageClientProps {
  canSave: boolean;
}

export function HomepageClient({ canSave }: HomepageClientProps) {
  const [result, setResult] = useState<{
    results: Record<string, PredictionResult>;
    odds?: number;
  } | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="space-y-8">
      <PredictionForm
        onResult={(data) => {
          const d = data as { results: Record<string, PredictionResult>; odds?: number };
          setResult({
            results: d.results,
            odds: d.odds,
          });
          setError("");
        }}
        onError={setError}
        canSave={canSave}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <PredictionResultDisplay
            results={result.results}
            odds={result.odds}
          />
        </div>
      )}
    </div>
  );
}
