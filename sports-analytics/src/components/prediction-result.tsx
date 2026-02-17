"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PredictionResult } from "@/types/prediction";
import { americanOddsToImpliedProb, calculateEV } from "@/lib/utils";

interface PredictionResultProps {
  results: Record<string, PredictionResult>;
  odds?: number;
}

function ResultCard({
  modelId,
  result,
  odds,
  defaultExpanded,
}: {
  modelId: string;
  result: PredictionResult;
  odds?: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  const impliedProb = odds ? americanOddsToImpliedProb(odds) : null;
  const ev = odds && impliedProb
    ? calculateEV(result.probability, impliedProb, odds)
    : null;

  const confidenceColor =
    result.confidence === "high"
      ? "text-emerald-400"
      : result.confidence === "medium"
      ? "text-amber-400"
      : "text-muted-foreground";

  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {modelId}
          </span>
          <span className="text-2xl font-bold tabular-nums">
            {(result.probability * 100).toFixed(1)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{result.bet}</p>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs ${confidenceColor}`}>
            {result.confidence} confidence
          </span>
          {result.edge !== undefined && (
            <span
              className={
                result.edge > 0 ? "text-emerald-400" : "text-muted-foreground"
              }
            >
              edge {result.edge > 0 ? "+" : ""}
              {(result.edge * 100).toFixed(1)}%
            </span>
          )}
          {ev !== null && (
            <span
              className={ev > 0 ? "text-emerald-400" : "text-muted-foreground"}
            >
              EV {ev > 0 ? "+" : ""}
              {(ev * 100).toFixed(1)}%
            </span>
          )}
          {result.recommended_units !== undefined && (
            <span className="text-muted-foreground">
              {result.recommended_units}u
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Explanation
            </>
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">
                {result.explanation}
              </p>
              {result.key_factors?.length > 0 && (
                <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside">
                  {result.key_factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function PredictionResultDisplay({ results, odds }: PredictionResultProps) {
  const entries = Object.entries(results);
  const isCompare = entries.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {isCompare ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {entries.map(([modelId, result]) => (
            <ResultCard
              key={modelId}
              modelId={modelId}
              result={result}
              odds={odds}
              defaultExpanded={false}
            />
          ))}
        </div>
      ) : entries[0] ? (
        <ResultCard
          modelId={entries[0][0]}
          result={entries[0][1]}
          odds={odds}
          defaultExpanded={true}
        />
      ) : null}
    </motion.div>
  );
}
