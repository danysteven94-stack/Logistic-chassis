"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Truck, FileText, History, UserCog, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/types";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/chassis", label: "Chassis", icon: Truck },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/audit-log", label: "Historique", icon: History },
];

export function Sidebar({ user }: { user: AppUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-deka-navy text-white">
      <div className="flex items-center gap-2 border-b border-white/10 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-deka-navy">DG</div>
        <div>
          <p className="text-sm font-semibold">Deka Group</p>
          <p className="text-xs text-white/60">Chassis Manager</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10",
              pathname.startsWith(href) && "bg-white/15 font-medium"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        {user?.role === "admin" && (
          <Link
            href="/users"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10",
              pathname.startsWith("/users") && "bg-white/15 font-medium"
            )}
          >
            <UserCog className="h-4 w-4" />
            Utilisateurs
          </Link>
        )}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 px-3 text-xs text-white/60">
          {user?.name} · <span className="uppercase">{user?.role}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Dekonekte
        </button>
      </div>
    </aside>
  );
}
