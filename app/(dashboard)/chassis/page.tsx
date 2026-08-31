import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ChassisDialog } from "@/components/chassis/chassis-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { SearchBox } from "@/components/search-box";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
  available: "success",
  in: "warning",
  out: "secondary",
};

export default async function ChassisPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("chassis").select("*").order("created_at", { ascending: false });
  if (q) query = query.ilike("chassis_number", `%${q}%`);
  const { data: chassisList } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-deka-navy">Chassis</h1>
          <p className="text-sm text-muted-foreground">Jere lis chassis DKN yo</p>
        </div>
        <ChassisDialog />
      </div>

      <SearchBox placeholder="Chèche pa numéro chassis..." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro Chassis</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dat antre</TableHead>
                <TableHead>Dat sòti</TableHead>
                <TableHead>Remak</TableHead>
                <TableHead className="text-right">Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(chassisList ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.chassis_number}</TableCell>
                  <TableCell>{c.type ?? "-"}</TableCell>
                  <TableCell><Badge variant={statusVariant[c.status]}>{c.status.toUpperCase()}</Badge></TableCell>
                  <TableCell>{c.date_in ? formatDate(c.date_in) : "-"}</TableCell>
                  <TableCell>{c.date_out ? formatDate(c.date_out) : "-"}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{c.notes ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <ChassisDialog chassis={c} trigger={<Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>} />
                  </TableCell>
                </TableRow>
              ))}
              {(chassisList ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Pa gen chassis</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
