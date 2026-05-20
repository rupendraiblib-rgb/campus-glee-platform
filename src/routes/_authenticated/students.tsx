import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({ meta: [{ title: "Students — Smart School ERP" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ admission_no: "", full_name: "", email: "", phone: "" });

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, admission_no, full_name, email, phone, classes(name), sections(name)")
        .order("admission_no");
      if (error) throw error;
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const { error } = await supabase.from("students").insert({
      ...form, school_id: profile.school_id,
    });
    if (error) return toast.error(error.message);
    toast.success("Student added.");
    setOpen(false);
    setForm({ admission_no: "", full_name: "", email: "", phone: "" });
    qc.invalidateQueries({ queryKey: ["students"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">Manage student records and admissions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add student</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New student</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5"><Label>Admission no.</Label><Input required value={form.admission_no} onChange={(e)=>setForm({...form, admission_no: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Full name</Label><Input required value={form.full_name} onChange={(e)=>setForm({...form, full_name: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} /></div>
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Adm. no</th><th className="p-3">Name</th><th className="p-3">Class</th><th className="p-3">Section</th><th className="p-3">Contact</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && (students?.length ?? 0) === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No students yet.</td></tr>}
            {students?.map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3 font-medium">{s.admission_no}</td>
                <td className="p-3">{s.full_name}</td>
                <td className="p-3">{s.classes?.name ?? "—"}</td>
                <td className="p-3">{s.sections?.name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{s.email || s.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
