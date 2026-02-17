"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODELS = [
  { id: "grok", label: "Grok (default)" },
  { id: "gpt", label: "GPT" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
];

export function SettingsClient() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model defaults</CardTitle>
          <CardDescription>
            Default AI model for predictions (can override per prompt)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Default model</Label>
            <Select defaultValue="grok">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tools (coming soon)</CardTitle>
          <CardDescription>
            Sportsbooks and analytics tools with affiliate links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section will display recommended sportsbooks and analytics
            tools based on your region. Admin-controlled. Coming in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
