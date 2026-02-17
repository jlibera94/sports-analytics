"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPORTS = ["NBA", "NFL", "NHL", "MLB", "Soccer", "UCL", "Euro", "Custom"];

interface Notebook {
  id: string;
  name: string;
  sport: string | null;
  created_at: string;
  updated_at: string;
}

interface NotebooksClientProps {
  notebooks: Notebook[];
}

export function NotebooksClient({ notebooks: initial }: NotebooksClientProps) {
  const [notebooks, setNotebooks] = useState(initial);
  const [name, setName] = useState("");
  const [sport, setSport] = useState("NBA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sport: sport === "Custom" ? null : sport,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create notebook");
        return;
      }

      setNotebooks((prev) => [data.notebook, ...prev]);
      setName("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notebooks</h1>
        <p className="text-muted-foreground">
          Organize predictions by sport or tournament
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">New notebook</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NBA 2025, UCL Knockouts"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Sport / Tournament</Label>
              <Select value={sport} onValueChange={setSport}>
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
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create notebook"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Your notebooks
        </h2>
        {notebooks.length === 0 ? (
          <p className="text-muted-foreground">No notebooks yet.</p>
        ) : (
          <div className="space-y-2">
            {notebooks.map((nb) => (
              <Link key={nb.id} href={`/notebooks/${nb.id}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{nb.name}</p>
                      {nb.sport && (
                        <p className="text-sm text-muted-foreground">{nb.sport}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(nb.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
