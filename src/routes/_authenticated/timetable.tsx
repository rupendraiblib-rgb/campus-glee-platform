import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({ meta: [{ title: "Timetable — Smart School ERP" }] }),
  component: TimetablePage,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const slots = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
];

function TimetablePage() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [classId, setClassId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ day_of_week: "1", start_time: "09:00", end_time: "10:00", subject_id: "", room: "" });

  const { data: classes } = useQuery({
    queryKey: ["classes-tt"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects-tt"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tt } = useQuery({
    queryKey: ["timetable", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("id, day_of_week, start_time, end_time, room, subject_id, subjects(name)")
        .eq("class_id", classId)
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !classId) return toast.error("Select a class first.");
    const { error } = await supabase.from("timetable_slots").insert({
      school_id: profile.school_id,
      class_id: classId,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      subject_id: form.subject_id || null,
      room: form.room || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Slot added.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["timetable", classId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("timetable_slots").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["timetable", classId] });
  };

  const cell = (dayIdx: number, slot: { start: string; end: string }) => {
    const match = tt?.find((s: any) =>
      s.day_of_week === dayIdx + 1 && s.start_time.slice(0, 5) === slot.start
    );
    if (!match) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="group flex items-start justify-between gap-1">
        <div>
          <div className="font-medium text-foreground">{(match as any).subjects?.name ?? "Class"}</div>
          {(match as any).room && <div className="text-xs text-muted-foreground">{(match as any).room}</div>}
        </div>
        <button onClick={() => remove(match.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly schedule per class.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button disabled={!classId}><Plus className="h-4 w-4 mr-1" />Add slot</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New slot</DialogTitle></DialogHeader>
              <form onSubmit={addSlot} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Day</Label>
                  <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{days.map((d, i) => <SelectItem key={d} value={String(i + 1)}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Room</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. 204" /></div>
                <DialogFooter><Button type="submit">Add</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!classId && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Select a class to view or edit its timetable.
        </div>
      )}

      {classId && (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <div className="grid grid-cols-7 text-xs min-w-[700px]">
            <div className="p-3 bg-muted/50 font-medium">Time</div>
            {days.map((d) => <div key={d} className="p-3 bg-muted/50 font-medium border-l border-border">{d}</div>)}
            {slots.map((t) => (
              <Fragment key={t.start}>
                <div className="p-3 border-t border-border text-muted-foreground">{t.start}</div>
                {days.map((_, idx) => (
                  <div key={t.start + idx} className="p-3 border-t border-l border-border text-xs">
                    {cell(idx, t)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
