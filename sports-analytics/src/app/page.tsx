import { Header } from "@/components/header";
import { PredictionForm } from "@/components/prediction-form";
import { PredictionResultDisplay } from "@/components/prediction-result";
import { Disclaimer } from "@/components/disclaimer";
import { HomepageClient } from "./homepage-client";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let user: { email?: string } | null = null;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch {
    // Supabase not configured or error
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Sports Betting Probabilities
          </h1>
          <p className="text-muted-foreground">
            AI-powered predictions. Compare models. Track your edge.
          </p>
        </div>
        <HomepageClient canSave={!!user} />
      </main>
      <footer className="py-4">
        <Disclaimer />
      </footer>
    </div>
  );
}
