"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PredictionResult } from "@/types/prediction";

interface Prediction {
  id: string;
  prompt: string;
  sport: string | null;
  bet_type: string | null;
  models_used: string[];
  result_json: PredictionResult;
  created_at: string;
}

interface NotebookDetailClientProps {
  notebook: { id: string; name: string; sport: string | null };
  predictions: Prediction[];
}

function PredictionEntry({ p }: { p: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const r = p.result_json;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{r.bet ?? p.prompt}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {r.bet_type ?? p.bet_type} • {(r.probability * 100).toFixed(1)}%
              • {r.confidence}
            </p>
            {p.models_used?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {p.models_used.join(", ")}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(p.created_at).toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Details
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
              <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
                <p className="text-sm text-muted-foreground">{r.explanation}</p>
                {r.key_factors?.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {r.key_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function NotebookDetailClient({
  notebook,
  predictions,
}: NotebookDetailClientProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/notebooks"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Notebooks
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {notebook.name}
          </h1>
          {notebook.sport && (
            <p className="text-muted-foreground">{notebook.sport}</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Saved predictions ({predictions.length})
        </h2>
        {predictions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No predictions saved yet. Run a prediction and save it here.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="mt-4">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {predictions.map((p) => (
              <PredictionEntry key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
