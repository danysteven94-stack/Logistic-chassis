import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ClientDialog } from "@/components/clients/client-dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { SearchBox } from "@/components/search-box";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-deka-navy">Clients</h1>
          <p className="text-sm text-muted-foreground">Jere lis kliyan Deka Group yo</p>
        </div>
        <ClientDialog />
      </div>

      <SearchBox placeholder="Chèche pa non kliyan..." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Non</TableHead>
                <TableHead>Konpayi</TableHead>
                <TableHead>Telefòn</TableHead>
                <TableHead>Adrès</TableHead>
                <TableHead className="text-right">Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clients ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.company ?? "-"}</TableCell>
                  <TableCell>{c.phone ?? "-"}</TableCell>
                  <TableCell>{c.address ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <ClientDialog client={c} trigger={<Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>} />
                  </TableCell>
                </TableRow>
              ))}
              {(clients ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Pa gen kliyan</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
