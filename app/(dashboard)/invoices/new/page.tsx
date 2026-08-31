import { InvoiceForm } from "@/components/invoices/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-deka-navy">Nouvo Facture</h1>
        <p className="text-sm text-muted-foreground">Kreye yon nouvo facture chassis DKN</p>
      </div>
      <InvoiceForm />
    </div>
  );
}
