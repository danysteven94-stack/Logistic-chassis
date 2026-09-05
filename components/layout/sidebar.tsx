"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Truck, FileText, History, UserCog, LogOut, Menu, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const NavLinks = () => (
    <>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-white/10",
            pathname.startsWith(href) && "bg-white/15 font-medium"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
      {user?.role === "admin" && (
        <Link
          href="/users"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-white/10",
            pathname.startsWith("/users") && "bg-white/15 font-medium"
          )}
        >
          <UserCog className="h-4 w-4 shrink-0" />
          Utilisateurs
        </Link>
      )}
    </>
  );

  return (
    <>
      {/* Barre supérieure mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-deka-navy px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-deka-navy">DG</div>
          <span className="text-sm font-semibold">Deka Group</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Ouvri meni">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar : fixe sur desktop, tiroir coulissant sur mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-deka-navy text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-deka-navy">DG</div>
            <div>
              <p className="text-sm font-semibold">Deka Group</p>
              <p className="text-xs text-white/60">Chassis Manager</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fèmen meni">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavLinks />
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 truncate px-3 text-xs text-white/60">
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
    </>
  );
}
