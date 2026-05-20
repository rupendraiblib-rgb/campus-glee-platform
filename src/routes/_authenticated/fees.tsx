import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => ({ meta: [{ title: "Fees — Smart School ERP" }] }),
  component: FeesPage,
});

function FeesPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees</h1>
        <p className="text-sm text-muted-foreground">Invoices, payments, and dues. Razorpay / Stripe integration ships in the next iteration.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Invoice #</th><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Due</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {(invoices?.length ?? 0) === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No invoices yet. Generate the first batch from a fee category.</td></tr>}
            {invoices?.map((i: any) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3 font-medium">{i.invoice_no}</td>
                <td className="p-3">{i.students?.full_name ?? "—"}</td>
                <td className="p-3">₹{Number(i.amount).toLocaleString()}</td>
                <td className="p-3">{i.due_date ?? "—"}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-md bg-muted">{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
