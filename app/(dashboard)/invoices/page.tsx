import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { SearchBox } from "@/components/search-box";
import { formatDate } from "@/lib/utils";
import { ExportButtons } from "@/components/invoices/export-buttons";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("*, client:clients(name, company)")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`invoice_number.ilike.%${q}%`);
  const { data: invoices } = await query;

  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("role").eq("id", authUser?.id).single();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-deka-navy">Factures</h1>
          <p className="text-sm text-muted-foreground">Lis tout faktè chassis DKN yo</p>
        </div>
        <div className="flex gap-2">
          {me?.role === "admin" && <ExportButtons invoices={invoices ?? []} />}
          <Link href="/invoices/new">
            <Button className="bg-deka-navy hover:bg-deka-navyLight"><Plus className="mr-2 h-4 w-4" />Nouvo Facture</Button>
          </Link>
        </div>
      </div>

      <SearchBox placeholder="Chèche pa numéro facture..." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Kliyan</TableHead>
                <TableHead>Dat</TableHead>
                <TableHead>Total IN</TableHead>
                <TableHead>Total OUT</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoices ?? []).map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.client?.name}</TableCell>
                  <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                  <TableCell>{inv.total_in}</TableCell>
                  <TableCell>{inv.total_out}</TableCell>
                  <TableCell className="font-semibold">{inv.balance}</TableCell>
                  <TableCell><Badge variant={inv.status === "printed" ? "secondary" : "success"}>{inv.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Link href={`/invoices/${inv.id}`}>
                      <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(invoices ?? []).length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Pa gen facture</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
