import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, users(name, email)")
    .order("date", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-deka-navy">Historique</h1>
        <p className="text-sm text-muted-foreground">Audit log — non modifiable, non effaçable</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aksyon</TableHead>
                <TableHead>Itilizatè</TableHead>
                <TableHead>Kalite</TableHead>
                <TableHead>Dat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs ?? []).map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.users?.name ?? "Système"}</TableCell>
                  <TableCell>{log.entity_type ?? "-"}</TableCell>
                  <TableCell>{formatDate(log.date)} {new Date(log.date).toLocaleTimeString("fr-FR")}</TableCell>
                </TableRow>
              ))}
              {(logs ?? []).length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Pa gen istorik</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
