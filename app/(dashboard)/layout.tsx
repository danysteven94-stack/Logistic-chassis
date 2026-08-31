import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import type { AppUser } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single();

  return (
    <div className="flex min-h-screen bg-deka-gray">
      <Sidebar user={user as AppUser} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
