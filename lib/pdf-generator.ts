import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "./types";

const NAVY: [number, number, number] = [11, 37, 69]; // #0B2545
const GRAY: [number, number, number] = [243, 245, 247]; // #F3F5F7

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Deka Group";
const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "";
const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "";

export function generateInvoicePDF(invoice: Invoice, logoDataUrl?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ---------------------------------------------------------
  // HEADER — logo/nom à gauche, "FACTURE" en gros à droite
  // ---------------------------------------------------------
  let leftX = margin;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin, 12, 16, 16);
      leftX = margin + 20;
    } catch {
      // logo optionnel
    }
  } else {
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, 12, 16, 16, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DG", margin + 8, 22, { align: "center" });
    leftX = margin + 20;
  }

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(COMPANY_NAME.toUpperCase(), leftX, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text("GESTION DES CHÂSSIS DKN", leftX, 23);

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("FACTURE", pageWidth - margin, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`FACTURE N° : ${invoice.invoice_number}`, pageWidth - margin, 27, { align: "right" });
  doc.text(`DATE : ${new Date(invoice.invoice_date).toLocaleDateString("fr-FR")}`, pageWidth - margin, 32, { align: "right" });

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(margin, 37, pageWidth - margin, 37);

  // ---------------------------------------------------------
  // ÉMETTEUR / DESTINATAIRE — deux colonnes
  // ---------------------------------------------------------
  let y = 45;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("ÉMETTEUR", margin, y);
  doc.text("DESTINATAIRE", pageWidth / 2 + 5, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  let yL = y + 6;
  doc.text(COMPANY_NAME, margin, yL); yL += 5;
  if (COMPANY_ADDRESS) { doc.text(COMPANY_ADDRESS, margin, yL); yL += 5; }
  if (COMPANY_PHONE) { doc.text(COMPANY_PHONE, margin, yL); yL += 5; }

  let yR = y + 6;
  const clientX = pageWidth / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.text(invoice.client?.name ?? "", clientX, yR); yR += 5;
  doc.setFont("helvetica", "normal");
  if (invoice.client?.company) { doc.text(invoice.client.company, clientX, yR); yR += 5; }
  if (invoice.client?.address) { doc.text(invoice.client.address, clientX, yR); yR += 5; }
  if (invoice.client?.phone) { doc.text(`Tél : ${invoice.client.phone}`, clientX, yR); yR += 5; }

  y = Math.max(yL, yR) + 6;

  // ---------------------------------------------------------
  // TABLE
  // ---------------------------------------------------------
  const rows = (invoice.invoice_items ?? []).map((item) => [
    item.chassis_number,
    item.description ?? "",
    item.in_qty ? String(item.in_qty) : "-",
    item.out_qty ? String(item.out_qty) : "-",
    item.observation ?? "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Chassis Number", "Description", "IN", "OUT", "Observation"]],
    body: rows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3, lineColor: [220, 224, 229], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: GRAY },
    columnStyles: {
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "center", cellWidth: 18 },
    },
  });

  // ---------------------------------------------------------
  // TOTALS — bloc aligné à droite
  // ---------------------------------------------------------
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const boxW = 65;
  const boxX = pageWidth - margin - boxW;

  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL IN :", boxX, finalY + 5);
  doc.text(`${invoice.total_in}`, pageWidth - margin, finalY + 5, { align: "right" });

  doc.text("TOTAL OUT :", boxX, finalY + 11);
  doc.text(`${invoice.total_out}`, pageWidth - margin, finalY + 11, { align: "right" });

  doc.setDrawColor(210, 214, 219);
  doc.line(boxX, finalY + 14, pageWidth - margin, finalY + 14);

  doc.setFillColor(...NAVY);
  doc.rect(boxX, finalY + 17, boxW, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("BALANCE :", boxX + 3, finalY + 23);
  doc.text(`${invoice.balance}`, pageWidth - margin - 3, finalY + 23, { align: "right" });

  // ---------------------------------------------------------
  // RÈGLEMENT / NOTES (gauche) — SIGNATURE / CACHET (droite)
  // ---------------------------------------------------------
  const sigY = finalY + 40;
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("REMARQUE :", margin, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Merci de vérifier les numéros de châssis avant signature.", margin, sigY + 5);

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 55, sigY + 12, pageWidth - margin, sigY + 12);
  doc.setFontSize(8);
  doc.text("Signature", pageWidth - margin - 55, sigY + 17);

  doc.line(pageWidth - margin - 55, sigY + 26, pageWidth - margin, sigY + 26);
  doc.text("Cachet Deka Group", pageWidth - margin - 55, sigY + 31);

  // ---------------------------------------------------------
  // FOOTER
  // ---------------------------------------------------------
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("DEKA GROUP — Gestion des Châssis DKN", pageWidth / 2, pageHeight - 6, { align: "center" });

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, logoDataUrl?: string) {
  const doc = generateInvoicePDF(invoice, logoDataUrl);
  doc.save(`${invoice.invoice_number}.pdf`);
}
