import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { NotebooksClient } from "./notebooks-client";
import { Disclaimer } from "@/components/disclaimer";

export default async function NotebooksPage() {
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
  const { data: notebooks = [] } = await supabase
    .from("notebooks")
    .select("id, name, sport, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <NotebooksClient notebooks={notebooks} />
      </main>
      <footer className="py-4">
        <Disclaimer />
      </footer>
    </div>
  );
}
