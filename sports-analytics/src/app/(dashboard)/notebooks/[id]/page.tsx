import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { NotebookDetailClient } from "./notebook-detail-client";
import { Disclaimer } from "@/components/disclaimer";

export default async function NotebookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: notebook } = await supabase
    .from("notebooks")
    .select("id, name, sport")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!notebook) notFound();

  const { data: predictions = [] } = await supabase
    .from("predictions")
    .select("id, prompt, sport, bet_type, models_used, result_json, created_at")
    .eq("notebook_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <NotebookDetailClient
          notebook={notebook}
          predictions={predictions}
        />
      </main>
      <footer className="py-4">
        <Disclaimer />
      </footer>
    </div>
  );
}
