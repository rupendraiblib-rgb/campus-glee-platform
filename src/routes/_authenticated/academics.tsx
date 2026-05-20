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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/academics")({
  head: () => ({ meta: [{ title: "Academics — Smart School ERP" }] }),
  component: AcademicsPage,
});

function AcademicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
        <p className="text-sm text-muted-foreground">Manage classes, sections, and subjects for your school.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassesCard />
        <SubjectsCard />
      </div>
    </div>
  );
}

function ClassesCard() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [openCls, setOpenCls] = useState(false);
  const [openSec, setOpenSec] = useState<string | null>(null);
  const [cls, setCls] = useState({ name: "", grade_level: "" });
  const [sec, setSec] = useState({ name: "" });

  const { data: classes } = useQuery({
    queryKey: ["academics-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, grade_level, sections(id, name)")
        .order("grade_level", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const { error } = await supabase.from("classes").insert({
      school_id: profile.school_id,
      name: cls.name,
      grade_level: cls.grade_level ? Number(cls.grade_level) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Class added.");
    setOpenCls(false);
    setCls({ name: "", grade_level: "" });
    qc.invalidateQueries({ queryKey: ["academics-classes"] });
  };

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !openSec) return;
    const { error } = await supabase.from("sections").insert({
      school_id: profile.school_id,
      class_id: openSec,
      name: sec.name,
    });
    if (error) return toast.error(error.message);
    toast.success("Section added.");
    setOpenSec(null);
    setSec({ name: "" });
    qc.invalidateQueries({ queryKey: ["academics-classes"] });
  };

  const removeClass = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["academics-classes"] });
  };

  const removeSection = async (id: string) => {
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["academics-classes"] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-semibold">Classes & sections</h2>
          <p className="text-xs text-muted-foreground">Grades and their sub-divisions.</p>
        </div>
        <Dialog open={openCls} onOpenChange={setOpenCls}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New class</DialogTitle></DialogHeader>
            <form onSubmit={addClass} className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input required value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} placeholder="Grade 5" /></div>
              <div className="space-y-1.5"><Label>Grade level</Label><Input type="number" value={cls.grade_level} onChange={(e) => setCls({ ...cls, grade_level: e.target.value })} placeholder="5" /></div>
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="divide-y divide-border">
        {(classes?.length ?? 0) === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No classes yet.</div>
        )}
        {classes?.map((c: any) => (
          <div key={c.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <div className="font-medium">{c.name}</div>
                {c.grade_level != null && <div className="text-xs text-muted-foreground">Grade {c.grade_level}</div>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setOpenSec(c.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Section
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeClass(c.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            {c.sections?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {c.sections.map((s: any) => (
                  <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                    {s.name}
                    <button onClick={() => removeSection(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!openSec} onOpenChange={(v) => !v && setOpenSec(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New section</DialogTitle></DialogHeader>
          <form onSubmit={addSection} className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input required value={sec.name} onChange={(e) => setSec({ name: e.target.value })} placeholder="A" /></div>
            <DialogFooter><Button type="submit">Add</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubjectsCard() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  const { data: subjects } = useQuery({
    queryKey: ["academics-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name, code").order("name");
      if (error) throw error;
      return data;
    },
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const { error } = await supabase.from("subjects").insert({
      school_id: profile.school_id, name: form.name, code: form.code || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Subject added.");
    setOpen(false);
    setForm({ name: "", code: "" });
    qc.invalidateQueries({ queryKey: ["academics-subjects"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["academics-subjects"] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-semibold">Subjects</h2>
          <p className="text-xs text-muted-foreground">Used for exams and timetable.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New subject</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics" /></div>
              <div className="space-y-1.5"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MATH" /></div>
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="divide-y divide-border">
        {(subjects?.length ?? 0) === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No subjects yet.</div>}
        {subjects?.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium text-sm">{s.name}</div>
              {s.code && <div className="text-xs text-muted-foreground">{s.code}</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      {/* unused select kept to silence import */}
      <div className="hidden"><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="x">x</SelectItem></SelectContent></Select></div>
    </div>
  );
}
