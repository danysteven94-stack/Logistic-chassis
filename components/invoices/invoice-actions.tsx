"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { downloadInvoicePDF } from "@/lib/pdf-generator";
import { logActivity } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { Invoice } from "@/lib/types";

export function InvoiceActions({ invoice, canReprint }: { invoice: Invoice; canReprint: boolean }) {
  const router = useRouter();

  const handleDownload = async () => {
    downloadInvoicePDF(invoice);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    await logActivity(supabase, auth.user?.id, `Facture téléchargée: ${invoice.invoice_number}`, "invoice", invoice.id);
  };

  const handlePrint = async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("invoices").update({ status: "printed", updated_by: auth.user?.id }).eq("id", invoice.id);
    await logActivity(supabase, auth.user?.id, `Facture imprimée: ${invoice.invoice_number}`, "invoice", invoice.id);
    downloadInvoicePDF(invoice);
    toast.success("Facture imprimée");
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" /> Télécharger PDF
      </Button>
      <Button className="bg-deka-navy hover:bg-deka-navyLight" onClick={handlePrint} disabled={!canReprint}>
        <Printer className="mr-2 h-4 w-4" /> {invoice.status === "printed" ? "Réimprimer" : "Imprimer"}
      </Button>
    </div>
  );
}
