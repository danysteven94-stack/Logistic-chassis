"use client";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { invoiceSchema, type InvoiceFormValues } from "@/lib/validations";
import { logActivity } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";

export function InvoiceForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<InvoiceFormValues>({
      resolver: zodResolver(invoiceSchema),
      defaultValues: {
        invoice_date: new Date().toISOString().slice(0, 10),
        items: [{ chassis_number: "", description: "", in_qty: 0, out_qty: 0, observation: "" }],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("clients").select("*").order("name");
      setClients((data ?? []) as Client[]);
    })();
  }, []);

  const totalIn = items?.reduce((s, i) => s + (Number(i.in_qty) || 0), 0) ?? 0;
  const totalOut = items?.reduce((s, i) => s + (Number(i.out_qty) || 0), 0) ?? 0;

  const onSubmit = async (values: InvoiceFormValues) => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        client_id: values.client_id,
        invoice_date: values.invoice_date,
        created_by: auth.user?.id,
        updated_by: auth.user?.id,
      })
      .select()
      .single();

    if (error || !invoice) {
      toast.error("Erè pandan kreyasyon fakti a: " + error?.message);
      return;
    }

    const itemsPayload = values.items.map((it) => ({
      invoice_id: invoice.id,
      chassis_number: it.chassis_number,
      description: it.description,
      in_qty: it.in_qty,
      out_qty: it.out_qty,
      observation: it.observation,
    }));

    const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);
    if (itemsError) {
      toast.error("Erè pandan kreyasyon liy yo: " + itemsError.message);
      return;
    }

    await logActivity(supabase, auth.user?.id, `Facture créée: ${invoice.invoice_number}`, "invoice", invoice.id);
    toast.success("Facture créée avec succès");
    router.push(`/invoices/${invoice.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Enfòmasyon Facture</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Kliyan *</Label>
            <Select onValueChange={(v) => setValue("client_id", v)}>
              <SelectTrigger><SelectValue placeholder="Chwazi yon kliyan" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p className="text-xs text-red-600">{errors.client_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Dat *</Label>
            <Input type="date" {...register("invoice_date")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tablo Chassis</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ chassis_number: "", description: "", in_qty: 0, out_qty: 0, observation: "" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajoute Liy
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20">IN</TableHead>
                <TableHead className="w-20">OUT</TableHead>
                <TableHead>Observation</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input {...register(`items.${index}.chassis_number`)} placeholder="DKN-001" />
                  </TableCell>
                  <TableCell>
                    <Input {...register(`items.${index}.description`)} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" min={0} {...register(`items.${index}.in_qty`)} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" min={0} {...register(`items.${index}.out_qty`)} />
                  </TableCell>
                  <TableCell>
                    <Input {...register(`items.${index}.observation`)} />
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {errors.items && <p className="p-3 text-xs text-red-600">{errors.items.message as string}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-end gap-1 p-5 text-sm">
          <p>Total IN: <span className="font-semibold">{totalIn}</span></p>
          <p>Total OUT: <span className="font-semibold">{totalOut}</span></p>
          <p className="text-lg">Balance: <span className="font-bold text-deka-navy">{totalIn - totalOut}</span></p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="bg-deka-navy hover:bg-deka-navyLight" disabled={isSubmitting}>
          {isSubmitting ? "Ap kreye..." : "Kreye Facture"}
        </Button>
      </div>
    </form>
  );
}
