import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";

export default async function ProfilePage() {
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
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Your account details</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Email and account info</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <span className="text-muted-foreground">Email:</span>{" "}
                {user.email}
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                Member since {new Date(user.created_at ?? "").toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-4">
        <Disclaimer />
      </footer>
    </div>
  );
}
