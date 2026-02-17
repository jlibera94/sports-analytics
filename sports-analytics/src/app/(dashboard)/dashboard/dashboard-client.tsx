"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionForm } from "@/components/prediction-form";
import { PredictionResultDisplay } from "@/components/prediction-result";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import type { PredictionResult } from "@/types/prediction";

interface Notebook {
  id: string;
  name: string;
  sport: string | null;
  created_at: string;
  updated_at: string;
}

interface TrendingEvent {
  id: string;
  sport: string;
  event_name: string;
  start_time: string | null;
}

interface DashboardClientProps {
  notebooks: Notebook[];
  trending: TrendingEvent[];
}

const notebookOptions = (nb: Notebook) => ({
  id: nb.id,
  name: nb.name,
  sport: nb.sport,
});

export function DashboardClient({
  notebooks,
  trending,
}: DashboardClientProps) {
  const [result, setResult] = useState<{
    results: Record<string, PredictionResult>;
    odds?: number;
  } | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Your Journal</h1>
        <p className="text-muted-foreground">Trending games and your notebooks</p>
      </div>

      {/* Trending bar */}
      {trending.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Trending
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 scrollbar-thin">
            {trending.map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0"
              >
                <Link href={`/?prompt=${encodeURIComponent(ev.event_name)}`}>
                  <Card className="w-64 cursor-pointer hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <span className="text-xs text-muted-foreground uppercase">
                        {ev.sport}
                      </span>
                      <p className="font-medium mt-1 truncate">{ev.event_name}</p>
                      {ev.start_time && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ev.start_time).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Quick prompt */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Quick prompt
        </h2>
        <PredictionForm
          notebooks={notebooks.map(notebookOptions)}
          canSave
          onResult={(data) => {
            const d = data as {
              results: Record<string, PredictionResult>;
              odds?: number;
            };
            setResult({ results: d.results, odds: d.odds });
            setError("");
          }}
          onError={setError}
          canSave
        />
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {result && (
          <div className="mt-6">
            <PredictionResultDisplay
              results={result.results}
              odds={result.odds}
            />
          </div>
        )}
      </section>

      {/* Notebooks */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Your notebooks
        </h2>
        {notebooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No notebooks yet. Create one to organize your predictions.
              </p>
              <Link href="/notebooks">
                <Button>Create notebook</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((nb) => (
              <Link key={nb.id} href={`/notebooks/${nb.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{nb.name}</CardTitle>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {nb.sport && (
                      <p className="text-sm text-muted-foreground">{nb.sport}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {new Date(nb.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
