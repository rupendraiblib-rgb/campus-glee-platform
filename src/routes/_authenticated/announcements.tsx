import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Check, Inbox } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Smart School ERP" }] }),
  component: AnnouncementsPage,
});

type Audience = "all" | "teachers" | "students" | "parents" | "class";

function AnnouncementsPage() {
  const { profile, hasRole, user } = useAuth();
  const qc = useQueryClient();
  const canSend = hasRole("school_admin") || hasRole("super_admin");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; body: string; audience: Audience; class_id: string }>({
    title: "", body: "", audience: "all", class_id: "",
  });

  const { data: inbox } = useQuery({
    queryKey: ["my-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications").select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: sent } = useQuery({
    queryKey: ["sent-announcements", profile?.school_id],
    enabled: !!profile?.school_id && canSend,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications").select("title, body, created_at, link")
        .eq("school_id", profile!.school_id!)
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      // Dedupe by (title, body, minute) so a broadcast shows once
      const seen = new Set<string>();
      return (data ?? []).filter((n) => {
        const k = `${n.title}|${n.body}|${n.created_at?.slice(0, 16)}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      }).slice(0, 30);
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["ann-classes", profile?.school_id],
    enabled: !!profile?.school_id && canSend,
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("grade_level", { nullsFirst: false });
      return data ?? [];
    },
  });

  async function resolveRecipients(): Promise<string[]> {
    if (!profile?.school_id) return [];
    const sid = profile.school_id;

    if (form.audience === "class" && form.class_id) {
      const [{ data: students }, { data: links }] = await Promise.all([
        supabase.from("students").select("user_id").eq("class_id", form.class_id).not("user_id", "is", null),
        supabase.from("student_guardians").select("guardian_id, students!inner(class_id)").eq("students.class_id", form.class_id),
      ]);
      const ids = new Set<string>();
      students?.forEach((s) => s.user_id && ids.add(s.user_id));
      const gids = (links ?? []).map((l: any) => l.guardian_id);
      if (gids.length) {
        const { data: guards } = await supabase.from("guardians").select("user_id").in("id", gids).not("user_id", "is", null);
        guards?.forEach((g) => g.user_id && ids.add(g.user_id));
      }
      return [...ids];
    }

    if (form.audience === "all") {
      const { data } = await supabase.from("profiles").select("id").eq("school_id", sid);
      return (data ?? []).map((p) => p.id);
    }

    const roleMap = { teachers: "teacher", students: "student", parents: "parent" } as const;
    const role = roleMap[form.audience as keyof typeof roleMap];
    const { data } = await supabase.from("user_roles").select("user_id").eq("school_id", sid).eq("role", role);
    return [...new Set((data ?? []).map((r) => r.user_id))];
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const recipients = await resolveRecipients();
    if (recipients.length === 0) return toast.error("No recipients matched this audience.");
    const rows = recipients.map((uid) => ({
      user_id: uid, school_id: profile.school_id, title: form.title, body: form.body,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`);
    setOpen(false);
    setForm({ title: "", body: "", audience: "all", class_id: "" });
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
    qc.invalidateQueries({ queryKey: ["sent-announcements"] });
  };

  const markRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  };

  const markAll = async () => {
    if (!user) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  };

  const unread = inbox?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Broadcast updates to teachers, students and parents.</p>
        </div>
        {canSend && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New announcement</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
              <form onSubmit={send} className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Holiday on Friday" /></div>
                <div className="space-y-1.5"><Label>Message</Label>
                  <Textarea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Details..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Audience</Label>
                    <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as Audience })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone in school</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="class">Specific class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.audience === "class" && (
                    <div className="space-y-1.5"><Label>Class</Label>
                      <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter><Button type="submit">Send</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Your inbox</h2>
              {unread > 0 && <Badge variant="secondary">{unread} new</Badge>}
            </div>
            {unread > 0 && <Button size="sm" variant="ghost" onClick={markAll}><Check className="h-4 w-4 mr-1" />Mark all read</Button>}
          </div>
          <div className="divide-y divide-border max-h-[28rem] overflow-auto">
            {(inbox?.length ?? 0) === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No messages.</div>}
            {inbox?.map((n) => (
              <div key={n.id} className={`p-4 ${n.is_read ? "" : "bg-muted/30"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
                {n.body && <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</div>}
                {!n.is_read && (
                  <Button size="sm" variant="ghost" className="mt-2 h-7 px-2" onClick={() => markRead(n.id)}>
                    <Check className="h-3.5 w-3.5 mr-1" />Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {canSend && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Recently sent</h2>
            </div>
            <div className="divide-y divide-border max-h-[28rem] overflow-auto">
              {(sent?.length ?? 0) === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nothing sent yet.</div>}
              {sent?.map((n, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {n.body && <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{n.body}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
