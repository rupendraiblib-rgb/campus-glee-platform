import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function basicAuth() {
  const id = process.env.RAZORPAY_KEY_ID!;
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ invoiceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: invoice, error } = await supabase
      .from("fee_invoices")
      .select("id, invoice_no, amount, status, school_id")
      .eq("id", data.invoiceId)
      .single();
    if (error || !invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Invoice already paid");

    const amountPaise = Math.round(Number(invoice.amount) * 100);
    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: invoice.invoice_no,
        notes: { invoice_id: invoice.id, school_id: invoice.school_id },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("Razorpay order error", txt);
      throw new Error("Failed to create payment order");
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID!,
      invoiceNo: invoice.invoice_no,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      invoiceId: z.string().uuid(),
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const { supabase, userId } = context;
    const { data: invoice, error: invErr } = await supabase
      .from("fee_invoices")
      .select("id, amount")
      .eq("id", data.invoiceId)
      .single();
    if (invErr || !invoice) throw new Error("Invoice not found");

    const { error: payErr } = await supabase.from("fee_payments").insert({
      invoice_id: invoice.id,
      amount: invoice.amount,
      method: "razorpay",
      reference: data.razorpay_payment_id,
      recorded_by: userId,
    });
    if (payErr) throw payErr;

    const { error: updErr } = await supabase
      .from("fee_invoices")
      .update({ status: "paid" })
      .eq("id", invoice.id);
    if (updErr) throw updErr;

    return { ok: true };
  });

export const createDemoInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", context.userId)
      .single();
    if (!profile?.school_id) throw new Error("No school");

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", profile.school_id)
      .limit(1)
      .single();
    if (!student) throw new Error("Create a student first");

    const invoiceNo = `INV-${Date.now()}`;
    const { data, error } = await supabase
      .from("fee_invoices")
      .insert({
        school_id: profile.school_id,
        student_id: student.id,
        invoice_no: invoiceNo,
        amount: 500,
        status: "pending",
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  });
