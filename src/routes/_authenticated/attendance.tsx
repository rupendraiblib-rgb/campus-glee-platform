import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Smart School ERP" }] }),
  component: AttendancePage,
});

type Status = "present" | "absent" | "late" | "leave";

function AttendancePage() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const { data: students } = useQuery({
    queryKey: ["att-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students").select("id, full_name, admission_no").order("admission_no");
      if (error) throw error;
      return data;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance").select("student_id, status").eq("date", date);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.student_id, r.status])) as Record<string, Status>;
    },
  });

  const current = (sid: string): Status => marks[sid] ?? existing?.[sid] ?? "present";

  const save = async () => {
    if (!profile?.school_id || !students) return;
    const schoolId = profile.school_id;
    const rows = students.map((s) => ({
      school_id: schoolId, student_id: s.id, date, status: current(s.id),
    }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" });
    if (error) return toast.error(error.message);
    toast.success("Attendance saved.");
    qc.invalidateQueries({ queryKey: ["attendance", date] });
    setMarks({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark daily attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <Button onClick={save}>Save</Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y">
        {students?.map((s) => {
          const v = current(s.id);
          return (
            <div key={s.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{s.full_name}</div>
                <div className="text-xs text-muted-foreground">{s.admission_no}</div>
              </div>
              <div className="flex gap-1">
                {(["present","absent","late","leave"] as Status[]).map((st) => (
                  <button key={st} onClick={()=>setMarks({ ...marks, [s.id]: st })}
                    className={`px-3 py-1.5 text-xs rounded-md border ${v === st ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:bg-accent"}`}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
