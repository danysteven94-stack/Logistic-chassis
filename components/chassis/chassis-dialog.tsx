"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { chassisSchema, type ChassisFormValues } from "@/lib/validations";
import { logActivity } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Chassis } from "@/lib/types";

export function ChassisDialog({ chassis, trigger }: { chassis?: Chassis; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(chassis?.status ?? "available");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChassisFormValues>({
    resolver: zodResolver(chassisSchema),
    defaultValues: chassis
      ? {
          chassis_number: chassis.chassis_number,
          type: chassis.type ?? "",
          status: chassis.status,
          date_in: chassis.date_in ?? "",
          date_out: chassis.date_out ?? "",
          notes: chassis.notes ?? "",
        }
      : { status: "available" },
  });

  const onSubmit = async (values: ChassisFormValues) => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const payload = { ...values, status };

    if (chassis) {
      const { error } = await supabase.from("chassis").update(payload).eq("id", chassis.id);
      if (error) return toast.error("Erè: " + error.message);
      await logActivity(supabase, auth.user?.id, `Chassis modifié: ${values.chassis_number}`, "chassis", chassis.id);
      toast.success("Chassis modifye avèk siksè");
    } else {
      const { data, error } = await supabase.from("chassis").insert(payload).select().single();
      if (error) return toast.error("Erè: " + error.message);
      await logActivity(supabase, auth.user?.id, `Chassis créé: ${values.chassis_number}`, "chassis", data.id);
      toast.success("Chassis kreye avèk siksè");
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-deka-navy hover:bg-deka-navyLight">
            <Plus className="mr-2 h-4 w-4" /> Nouvo Chassis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chassis ? "Modifye Chassis" : "Nouvo Chassis"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Numéro Chassis *</Label>
            <Input {...register("chassis_number")} placeholder="DKN-001" />
            {errors.chassis_number && <p className="text-xs text-red-600">{errors.chassis_number.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type Chassis</Label>
            <Input {...register("type")} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in">IN</SelectItem>
                <SelectItem value="out">OUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dat antre</Label>
              <Input type="date" {...register("date_in")} />
            </div>
            <div className="space-y-1.5">
              <Label>Dat sòti</Label>
              <Input type="date" {...register("date_out")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Remak</Label>
            <Textarea {...register("notes")} />
          </div>
          <Button type="submit" className="w-full bg-deka-navy hover:bg-deka-navyLight" disabled={isSubmitting}>
            {isSubmitting ? "Ap sove..." : "Sove"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
