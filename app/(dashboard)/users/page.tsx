import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserDialog } from "@/components/users/user-dialog";
import { DeleteUserButton } from "@/components/users/delete-user-button";
import { formatDate } from "@/lib/utils";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("role").eq("id", authUser?.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-deka-navy">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Jere kont Admin ak Modpass yo</p>
        </div>
        <UserDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Non</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Kreye</TableHead>
                <TableHead className="text-right">Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {u.id !== authUser?.id && <DeleteUserButton userId={u.id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
