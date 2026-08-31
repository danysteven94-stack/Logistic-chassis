import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { formatDate } from "@/lib/utils";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, client:clients(*), invoice_items(*)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("role").eq("id", authUser?.id).single();
  const canReprint = me?.role === "admin" || me?.role === "modpass";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-deka-navy">{invoice.invoice_number}</h1>
            <Badge variant={invoice.status === "printed" ? "secondary" : "success"}>{invoice.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Créée le {formatDate(invoice.created_at)}</p>
        </div>
        <InvoiceActions invoice={invoice as any} canReprint={canReprint} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Émetteur</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-deka-navy">Deka Group</p>
            <p className="text-muted-foreground">Gestion des Châssis DKN</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Destinataire</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-deka-navy">{invoice.client?.name}</p>
            {invoice.client?.company && <p>{invoice.client.company}</p>}
            {invoice.client?.address && <p className="text-muted-foreground">{invoice.client.address}</p>}
            {invoice.client?.phone && <p className="text-muted-foreground">{invoice.client.phone}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Rezime</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Dat facture:</span> {formatDate(invoice.invoice_date)}</p>
            <p><span className="text-muted-foreground">Total IN:</span> {invoice.total_in}</p>
            <p><span className="text-muted-foreground">Total OUT:</span> {invoice.total_out}</p>
            <p className="text-base font-semibold text-deka-navy"><span className="text-muted-foreground font-normal">Balance:</span> {invoice.balance}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tablo Chassis</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IN</TableHead>
                <TableHead>OUT</TableHead>
                <TableHead>Observation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.invoice_items ?? []).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.chassis_number}</TableCell>
                  <TableCell>{item.description ?? "-"}</TableCell>
                  <TableCell>{item.in_qty || "-"}</TableCell>
                  <TableCell>{item.out_qty || "-"}</TableCell>
                  <TableCell>{item.observation ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
