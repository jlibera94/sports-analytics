import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { DashboardClient } from "./dashboard-client";
import { Disclaimer } from "@/components/disclaimer";

export default async function DashboardPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured
  }

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  let notebooks: { id: string; name: string; sport: string | null; created_at: string; updated_at: string }[] = [];
  let trending: { id: string; sport: string; event_name: string; start_time: string | null }[] = [];

  try {
    const [notebooksRes, trendingRes] = await Promise.all([
      supabase
        .from("notebooks")
        .select("id, name, sport, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("trending_events")
        .select("id, sport, event_name, start_time")
        .order("start_time", { ascending: true })
        .limit(10),
    ]);
    notebooks = notebooksRes.data ?? [];
    trending = trendingRes.data ?? [];
  } catch {
    // Tables may not exist yet
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <DashboardClient
          notebooks={notebooks}
          trending={trending}
        />
      </main>
      <footer className="py-4">
        <Disclaimer />
      </footer>
    </div>
  );
}
