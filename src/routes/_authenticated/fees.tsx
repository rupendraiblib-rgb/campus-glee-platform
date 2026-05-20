import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createDemoInvoice,
} from "@/lib/razorpay.functions";
import { downloadReceipt } from "@/lib/receipt";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => ({ meta: [{ title: "Fees — Smart School ERP" }] }),
  component: FeesPage,
});

const RZP_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RZP_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function FeesPage() {
  const qc = useQueryClient();
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const seedInvoice = useServerFn(createDemoInvoice);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadRazorpay();
  }, []);

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select("id, invoice_no, amount, due_date, status, students(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handlePay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Failed to load Razorpay");
      const order = await createOrder({ data: { invoiceId } });
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Smart School ERP",
        description: `Invoice ${order.invoiceNo}`,
        order_id: order.orderId,
        handler: async (resp: any) => {
          try {
            await verifyPayment({
              data: {
                invoiceId,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            toast.success("Payment successful");
            qc.invalidateQueries({ queryKey: ["invoices"] });
          } catch (e: any) {
            toast.error(e.message ?? "Verification failed");
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
        theme: { color: "#2563eb" },
      });
      rzp.on("payment.failed", (r: any) => toast.error(r.error?.description ?? "Payment failed"));
      rzp.open();
    } catch (e: any) {
      toast.error(e.message ?? "Could not start payment");
    } finally {
      setPayingId(null);
    }
  };

  const handleSeed = async () => {
    try {
      await seedInvoice({});
      toast.success("Demo invoice created");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create invoice");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fees</h1>
          <p className="text-sm text-muted-foreground">
            Invoices and Razorpay payments. Use test card 4111 1111 1111 1111, any future date, any CVV.
          </p>
        </div>
        <Button variant="outline" onClick={handleSeed}>+ Demo invoice (₹500)</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Student</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Due</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(invoices?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No invoices yet. Click “Demo invoice” to create one.
                </td>
              </tr>
            )}
            {invoices?.map((i: any) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3 font-medium">{i.invoice_no}</td>
                <td className="p-3">{i.students?.full_name ?? "—"}</td>
                <td className="p-3">₹{Number(i.amount).toLocaleString()}</td>
                <td className="p-3">{i.due_date ?? "—"}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      i.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {i.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {i.status !== "paid" && (
                    <Button
                      size="sm"
                      disabled={payingId === i.id}
                      onClick={() => handlePay(i.id)}
                    >
                      {payingId === i.id ? "Opening…" : "Pay now"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
