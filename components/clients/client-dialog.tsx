"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clientSchema, type ClientFormValues } from "@/lib/validations";
import { logActivity } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Client } from "@/lib/types";

export function ClientDialog({ client, trigger }: { client?: Client; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          name: client.name,
          company: client.company ?? "",
          phone: client.phone ?? "",
          email: client.email ?? "",
          address: client.address ?? "",
        }
      : {},
  });

  const onSubmit = async (values: ClientFormValues) => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (client) {
      const { error } = await supabase.from("clients").update(values).eq("id", client.id);
      if (error) return toast.error("Erè pandan modifikasyon an");
      await logActivity(supabase, auth.user?.id, `Client modifié: ${values.name}`, "client", client.id);
      toast.success("Kliyan modifye avèk siksè");
    } else {
      const { data, error } = await supabase.from("clients").insert(values).select().single();
      if (error) return toast.error("Erè pandan kreyasyon an");
      await logActivity(supabase, auth.user?.id, `Client créé: ${values.name}`, "client", data.id);
      toast.success("Kliyan kreye avèk siksè");
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-deka-navy hover:bg-deka-navyLight">
            <Plus className="mr-2 h-4 w-4" /> Nouvo Kliyan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Modifye Kliyan" : "Nouvo Kliyan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Non Kliyan *</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Konpayi</Label>
            <Input {...register("company")} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefòn</Label>
            <Input {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input {...register("email")} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Adrès</Label>
            <Textarea {...register("address")} />
          </div>
          <Button type="submit" className="w-full bg-deka-navy hover:bg-deka-navyLight" disabled={isSubmitting}>
            {isSubmitting ? "Ap sove..." : "Sove"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
