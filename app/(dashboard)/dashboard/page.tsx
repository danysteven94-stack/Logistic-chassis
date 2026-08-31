import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, FileText, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: totalInvoices }, { data: chassisList }, { data: items }, { data: recentLogs }] = await Promise.all([
    supabase.from("invoices").select("*", { count: "exact", head: true }),
    supabase.from("chassis").select("status"),
    supabase.from("invoice_items").select("in_qty, out_qty, created_at"),
    supabase.from("activity_logs").select("*, users(name)").order("date", { ascending: false }).limit(8),
  ]);

  const totalIn = (items ?? []).reduce((s, i) => s + (i.in_qty || 0), 0);
  const totalOut = (items ?? []).reduce((s, i) => s + (i.out_qty || 0), 0);
  const available = (chassisList ?? []).filter((c) => c.status === "available").length;

  // Regrouper par mois (6 derniers mois)
  const monthly: Record<string, { in: number; out: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    monthly[key] = { in: 0, out: 0 };
  }
  (items ?? []).forEach((it) => {
    const d = new Date(it.created_at);
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    if (monthly[key]) {
      monthly[key].in += it.in_qty || 0;
      monthly[key].out += it.out_qty || 0;
    }
  });
  const chartData = Object.entries(monthly).map(([month, v]) => ({ month, ...v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-deka-navy">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble des mouvements de chassis DKN</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Chassis IN" value={totalIn} icon={ArrowDownCircle} />
        <StatCard title="Total Chassis OUT" value={totalOut} icon={ArrowUpCircle} />
        <StatCard title="Total Factures" value={totalInvoices ?? 0} icon={FileText} />
        <StatCard title="Chassis disponibles" value={available} icon={Truck} />
        <StatCard title="Balance globale" value={totalIn - totalOut} icon={Truck} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Mouvements IN / OUT par mois</CardTitle></CardHeader>
          <CardContent><MonthlyChart data={chartData} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dernières opérations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(recentLogs ?? []).length === 0 && <p className="text-sm text-muted-foreground">Okenn operasyon.</p>}
            {(recentLogs ?? []).map((log: any) => (
              <div key={log.id} className="flex items-start justify-between border-b pb-2 text-sm last:border-0">
                <div>
                  <p className="font-medium text-deka-navy">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.users?.name ?? "Système"}</p>
                </div>
                <Badge variant="secondary">{formatDate(log.date)}</Badge>
              </div>
            ))}
            <Link href="/audit-log" className="block text-xs font-medium text-deka-navy hover:underline">
              Wè tout istorik →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
