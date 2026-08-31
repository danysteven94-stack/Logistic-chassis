"use client";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import type { Invoice } from "@/lib/types";

export function ExportButtons({ invoices }: { invoices: any[] }) {
  const rows = invoices.map((inv) => ({
    "N° Facture": inv.invoice_number,
    Client: inv.client?.name ?? "",
    Compagnie: inv.client?.company ?? "",
    Date: inv.invoice_date,
    "Total IN": inv.total_in,
    "Total OUT": inv.total_out,
    Balance: inv.balance,
    Statut: inv.status,
  }));

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "factures-deka-group.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Factures");
    XLSX.writeFile(wb, "factures-deka-group.xlsx");
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
      <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
    </div>
  );
}
