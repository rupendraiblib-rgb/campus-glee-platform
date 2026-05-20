import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export async function downloadReceipt(invoiceId: string) {
  const { data: invoice, error } = await supabase
    .from("fee_invoices")
    .select(
      "invoice_no, amount, status, due_date, created_at, students(full_name, admission_no), schools(name, address, email, phone)",
    )
    .eq("id", invoiceId)
    .single();
  if (error || !invoice) throw error ?? new Error("Invoice not found");

  const { data: payment } = await supabase
    .from("fee_payments")
    .select("amount, method, reference, paid_at")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const student: any = invoice.students;
  const school: any = invoice.schools;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFontSize(20).setFont("helvetica", "bold");
  doc.text(school?.name ?? "School", 50, y);
  y += 18;
  doc.setFontSize(10).setFont("helvetica", "normal");
  if (school?.address) { doc.text(school.address, 50, y); y += 14; }
  if (school?.email || school?.phone) {
    doc.text([school?.email, school?.phone].filter(Boolean).join("  •  "), 50, y);
    y += 14;
  }

  doc.setDrawColor(220).line(50, y + 6, W - 50, y + 6);
  y += 30;

  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.text("Payment Receipt", 50, y);
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`Invoice ${invoice.invoice_no}`, W - 50, y, { align: "right" });
  y += 26;

  const rows: [string, string][] = [
    ["Student", student?.full_name ?? "—"],
    ["Admission No", student?.admission_no ?? "—"],
    ["Invoice No", invoice.invoice_no],
    ["Issued", new Date(invoice.created_at).toLocaleDateString()],
    ["Due Date", invoice.due_date ?? "—"],
    ["Status", String(invoice.status).toUpperCase()],
    ["Payment Method", payment?.method ?? "—"],
    ["Payment Ref", payment?.reference ?? "—"],
    ["Paid On", payment?.paid_at ? new Date(payment.paid_at).toLocaleString() : "—"],
  ];
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold").text(k, 50, y);
    doc.setFont("helvetica", "normal").text(String(v), 200, y);
    y += 18;
  });

  y += 10;
  doc.setDrawColor(220).line(50, y, W - 50, y);
  y += 24;
  doc.setFontSize(12).setFont("helvetica", "bold");
  doc.text("Amount Paid", 50, y);
  doc.text(`INR ${Number(payment?.amount ?? invoice.amount).toLocaleString("en-IN")}`, W - 50, y, { align: "right" });

  y += 50;
  doc.setFontSize(9).setFont("helvetica", "italic").setTextColor(120);
  doc.text("This is a computer-generated receipt and does not require a signature.", 50, y);

  doc.save(`receipt-${invoice.invoice_no}.pdf`);
}
