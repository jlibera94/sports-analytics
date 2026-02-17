import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { SettingsClient } from "./settings-client";
import { Disclaimer } from "@/components/disclaimer";

export default async function SettingsPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <SettingsClient />
      </main>
      <footer className="py-4">
        <Disclaimer />
      </footer>
    </div>
  );
}
