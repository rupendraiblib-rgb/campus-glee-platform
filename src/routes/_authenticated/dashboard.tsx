import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ClipboardCheck, Wallet, GraduationCap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Smart School ERP" }] }),
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, tone = "primary" }: { icon: any; label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg bg-${tone}/10 text-${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ["dash-counts"],
    queryFn: async () => {
      const [s, c, e, i] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("exams").select("*", { count: "exact", head: true }),
        supabase.from("fee_invoices").select("amount", { count: "exact" }),
      ]);
      const revenue = (i.data ?? []).reduce((sum, r: any) => sum + Number(r.amount || 0), 0);
      return {
        students: s.count ?? 0,
        classes: c.count ?? 0,
        exams: e.count ?? 0,
        revenue,
      };
    },
  });

  const attendanceData = [
    { day: "Mon", present: 92 }, { day: "Tue", present: 88 }, { day: "Wed", present: 94 },
    { day: "Thu", present: 90 }, { day: "Fri", present: 96 }, { day: "Sat", present: 85 },
  ];
  const revenueData = [
    { m: "Jan", r: 120 }, { m: "Feb", r: 140 }, { m: "Mar", r: 135 },
    { m: "Apr", r: 168 }, { m: "May", r: 180 }, { m: "Jun", r: 195 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A snapshot of your school today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={counts?.students ?? "—"} />
        <StatCard icon={GraduationCap} label="Classes" value={counts?.classes ?? "—"} />
        <StatCard icon={ClipboardCheck} label="Exams" value={counts?.exams ?? "—"} />
        <StatCard icon={Wallet} label="Invoiced (₹)" value={(counts?.revenue ?? 0).toLocaleString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Weekly attendance %</h3>
          <div className="h-64 mt-3">
            <ResponsiveContainer>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" /><YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="var(--color-primary)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Revenue trend (₹k)</h3>
          <div className="h-64 mt-3">
            <ResponsiveContainer>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="m" /><YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="r" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
