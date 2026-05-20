import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardEdit } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Exams — Smart School ERP" }] }),
  component: ExamsPage,
});

function gradeFor(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 35) return "E";
  return "F";
}

function ExamsPage() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [openNew, setOpenNew] = useState(false);
  const [marksFor, setMarksFor] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", class_id: "", subject_id: "", exam_date: "", max_marks: 100, pass_marks: 35 });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id, name, exam_date, max_marks, pass_marks, class_id, subject_id, classes(name), subjects(name)")
        .order("exam_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const { error } = await supabase.from("exams").insert({
      school_id: profile.school_id,
      name: form.name,
      class_id: form.class_id || null,
      subject_id: form.subject_id || null,
      exam_date: form.exam_date || null,
      max_marks: form.max_marks,
      pass_marks: form.pass_marks,
    });
    if (error) return toast.error(error.message);
    toast.success("Exam created.");
    setOpenNew(false);
    setForm({ name: "", class_id: "", subject_id: "", exam_date: "", max_marks: 100, pass_marks: 35 });
    qc.invalidateQueries({ queryKey: ["exams"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams & Results</h1>
          <p className="text-sm text-muted-foreground">Schedule exams, enter marks, and view grades.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New exam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule exam</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5"><Label>Exam name</Label><Input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="Mid-term Math" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Class</Label>
                  <Select value={form.class_id} onValueChange={(v)=>setForm({...form, class_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{classes?.map((c:any)=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={form.subject_id} onValueChange={(v)=>setForm({...form, subject_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{subjects?.map((s:any)=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.exam_date} onChange={(e)=>setForm({...form, exam_date: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Max marks</Label><Input type="number" value={form.max_marks} onChange={(e)=>setForm({...form, max_marks: Number(e.target.value)})} /></div>
                <div className="space-y-1.5"><Label>Pass marks</Label><Input type="number" value={form.pass_marks} onChange={(e)=>setForm({...form, pass_marks: Number(e.target.value)})} /></div>
              </div>
              <DialogFooter><Button type="submit">Create</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Exam</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Date</th><th className="p-3">Max</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && (exams?.length ?? 0) === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No exams scheduled yet.</td></tr>}
            {exams?.map((e: any) => (
              <tr key={e.id} className="border-t border-border">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3">{e.classes?.name ?? "—"}</td>
                <td className="p-3">{e.subjects?.name ?? "—"}</td>
                <td className="p-3">{e.exam_date ?? "—"}</td>
                <td className="p-3">{e.max_marks}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={()=>setMarksFor(e)}>
                    <ClipboardEdit className="h-4 w-4 mr-1" />Marks
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {marksFor && <MarksDialog exam={marksFor} onClose={()=>setMarksFor(null)} />}
    </div>
  );
}

function MarksDialog({ exam, onClose }: { exam: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: students } = useQuery({
    queryKey: ["exam-students", exam.id, exam.class_id],
    queryFn: async () => {
      let q = supabase.from("students").select("id, admission_no, full_name").order("admission_no");
      if (exam.class_id) q = q.eq("class_id", exam.class_id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["exam-marks", exam.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_marks").select("id, student_id, marks").eq("exam_id", exam.id);
      if (error) throw error;
      return data;
    },
  });

  const [edits, setEdits] = useState<Record<string, string>>({});

  const getValue = (sid: string) => {
    if (edits[sid] !== undefined) return edits[sid];
    const row = existing?.find((m:any)=>m.student_id===sid);
    return row ? String(row.marks) : "";
  };

  const save = async () => {
    const rows = Object.entries(edits)
      .filter(([, v]) => v !== "")
      .map(([student_id, v]) => {
        const marks = Number(v);
        const pct = (marks / exam.max_marks) * 100;
        return { exam_id: exam.id, student_id, marks, grade: gradeFor(pct) };
      });
    if (rows.length === 0) { onClose(); return; }
    // Delete existing rows for these students then re-insert (simple upsert)
    const sids = rows.map(r => r.student_id);
    const del = await supabase.from("exam_marks").delete().eq("exam_id", exam.id).in("student_id", sids);
    if (del.error) return toast.error(del.error.message);
    const ins = await supabase.from("exam_marks").insert(rows);
    if (ins.error) return toast.error(ins.error.message);
    toast.success("Marks saved.");
    qc.invalidateQueries({ queryKey: ["exam-marks", exam.id] });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exam.name} — Marks (max {exam.max_marks})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground sticky top-0">
              <tr><th className="p-3">Adm.</th><th className="p-3">Student</th><th className="p-3 w-32">Marks</th><th className="p-3">Grade</th></tr>
            </thead>
            <tbody>
              {(students?.length ?? 0) === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No students in this class.</td></tr>}
              {students?.map((s:any) => {
                const v = getValue(s.id);
                const n = Number(v);
                const grade = v !== "" && !isNaN(n) ? gradeFor((n/exam.max_marks)*100) : "—";
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3 font-medium">{s.admission_no}</td>
                    <td className="p-3">{s.full_name}</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={0}
                        max={exam.max_marks}
                        value={v}
                        onChange={(e)=>setEdits({...edits, [s.id]: e.target.value})}
                      />
                    </td>
                    <td className="p-3">{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save marks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
