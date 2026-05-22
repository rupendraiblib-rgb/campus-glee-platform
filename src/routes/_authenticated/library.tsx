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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, BookMarked, Trash2, ArrowLeftRight, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title too long"),
  author: z.string().trim().max(255, "Author too long").optional().or(z.literal("")),
  isbn: z.string().trim().max(20, "ISBN too long").regex(/^[0-9Xx\-\s]*$/, "ISBN may only contain digits, X, dashes").optional().or(z.literal("")),
  category: z.string().trim().max(100, "Category too long").optional().or(z.literal("")),
  total_copies: z.coerce.number().int().min(1, "At least 1 copy").max(10000, "Too many copies"),
});

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — Smart School ERP" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground">Catalog books and track issues &amp; returns.</p>
      </div>
      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
        </TabsList>
        <TabsContent value="books" className="mt-4"><BooksTab /></TabsContent>
        <TabsContent value="loans" className="mt-4"><LoansTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function BooksTab() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const empty = { title: "", author: "", isbn: "", category: "", total_copies: "1" };
  const [form, setForm] = useState(empty);

  const { data: books } = useQuery({
    queryKey: ["library-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("library_books").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });

  const filtered = books?.filter((b) =>
    !q || [b.title, b.author, b.isbn, b.category].some((f) => f?.toLowerCase().includes(q.toLowerCase()))
  );

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title ?? "",
      author: b.author ?? "",
      isbn: b.isbn ?? "",
      category: b.category ?? "",
      total_copies: String(b.total_copies ?? 1),
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const parsed = bookSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const v = parsed.data;

    if (editing) {
      const issued = (editing.total_copies ?? 0) - (editing.available_copies ?? 0);
      if (v.total_copies < issued) {
        return toast.error(`Copies cannot be less than currently issued (${issued}).`);
      }
      const { error } = await supabase.from("library_books").update({
        title: v.title,
        author: v.author || null,
        isbn: v.isbn || null,
        category: v.category || null,
        total_copies: v.total_copies,
        available_copies: v.total_copies - issued,
      }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Book updated.");
    } else {
      const { error } = await supabase.from("library_books").insert({
        school_id: profile.school_id,
        title: v.title,
        author: v.author || null,
        isbn: v.isbn || null,
        category: v.category || null,
        total_copies: v.total_copies,
        available_copies: v.total_copies,
      });
      if (error) return toast.error(error.message);
      toast.success("Book added.");
    }
    setOpen(false); setEditing(null); setForm(empty);
    qc.invalidateQueries({ queryKey: ["library-books"] });
    qc.invalidateQueries({ queryKey: ["loanable-books"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("library_books").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["library-books"] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author, ISBN..." className="max-w-sm" />
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add book</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit book" : "New book"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Author</Label><Input maxLength={255} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Category</Label><Input maxLength={100} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Fiction" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>ISBN</Label><Input maxLength={20} value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Copies</Label><Input type="number" min="1" max="10000" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} /></div>
              </div>
              {editing && (
                <p className="text-xs text-muted-foreground">
                  Currently issued: {(editing.total_copies ?? 0) - (editing.available_copies ?? 0)}. Total copies cannot go below that.
                </p>
              )}
              <DialogFooter><Button type="submit">{editing ? "Save changes" : "Save"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="divide-y divide-border">
        {(filtered?.length ?? 0) === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No books yet.</div>}
        {filtered?.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted shrink-0">
                <BookMarked className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{b.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {b.author || "Unknown author"}{b.category && ` • ${b.category}`}{b.isbn && ` • ${b.isbn}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={b.available_copies > 0 ? "secondary" : "outline"}>
                {b.available_copies}/{b.total_copies} available
              </Badge>
              <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoansTab() {
  const qc = useQueryClient();
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ book_id: "", student_id: "", due_date: "" });

  const { data: loans } = useQuery({
    queryKey: ["book-loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_loans")
        .select("id, book_id, issue_date, due_date, return_date, status, library_books(title), students(full_name, admission_no)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: books } = useQuery({
    queryKey: ["loanable-books"],
    queryFn: async () => {
      const { data } = await supabase.from("library_books").select("id, title, available_copies").gt("available_copies", 0).order("title");
      return data ?? [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["loan-students"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id, full_name, admission_no").eq("status", "active").order("full_name");
      return data ?? [];
    },
  });

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return toast.error("No school assigned.");
    const book = books?.find((b) => b.id === form.book_id);
    if (!book || book.available_copies < 1) return toast.error("Book not available.");
    const { error } = await supabase.from("book_loans").insert({
      school_id: profile.school_id,
      book_id: form.book_id, student_id: form.student_id, due_date: form.due_date,
      issued_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("library_books")
      .update({ available_copies: book.available_copies - 1 }).eq("id", form.book_id);
    if (e2) return toast.error(e2.message);
    toast.success("Book issued.");
    setOpen(false); setForm({ book_id: "", student_id: "", due_date: "" });
    qc.invalidateQueries({ queryKey: ["book-loans"] });
    qc.invalidateQueries({ queryKey: ["loanable-books"] });
    qc.invalidateQueries({ queryKey: ["library-books"] });
  };

  const markReturned = async (loanId: string, bookId: string) => {
    const { error } = await supabase.from("book_loans")
      .update({ status: "returned", return_date: new Date().toISOString().slice(0, 10) })
      .eq("id", loanId);
    if (error) return toast.error(error.message);
    const { data: bk } = await supabase.from("library_books").select("available_copies, total_copies").eq("id", bookId).single();
    if (bk) {
      await supabase.from("library_books")
        .update({ available_copies: Math.min(bk.total_copies, bk.available_copies + 1) })
        .eq("id", bookId);
    }
    toast.success("Marked as returned.");
    qc.invalidateQueries({ queryKey: ["book-loans"] });
    qc.invalidateQueries({ queryKey: ["loanable-books"] });
    qc.invalidateQueries({ queryKey: ["library-books"] });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Loans</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Issue book</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue book</DialogTitle></DialogHeader>
            <form onSubmit={issue} className="space-y-3">
              <div className="space-y-1.5"><Label>Book</Label>
                <Select value={form.book_id} onValueChange={(v) => setForm({ ...form, book_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select available book" /></SelectTrigger>
                  <SelectContent>
                    {books?.map((b) => <SelectItem key={b.id} value={b.id}>{b.title} ({b.available_copies})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Student</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students?.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name} • {s.admission_no}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Due date</Label>
                <Input type="date" required min={today} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <DialogFooter><Button type="submit" disabled={!form.book_id || !form.student_id || !form.due_date}>Issue</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="divide-y divide-border">
        {(loans?.length ?? 0) === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No loans recorded yet.</div>}
        {loans?.map((l: any) => {
          const overdue = l.status === "issued" && new Date(l.due_date) < new Date();
          return (
            <div key={l.id} className="flex items-center justify-between p-4 gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted shrink-0">
                  <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{l.library_books?.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.students?.full_name} • {l.students?.admission_no} • Due {format(new Date(l.due_date), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {l.status === "returned" ? (
                  <Badge variant="secondary">Returned {l.return_date && format(new Date(l.return_date), "MMM d")}</Badge>
                ) : overdue ? (
                  <Badge variant="destructive">Overdue</Badge>
                ) : (
                  <Badge>Issued</Badge>
                )}
                {l.status !== "returned" && (
                  <Button size="sm" variant="outline" onClick={() => markReturned(l.id, l.book_id)}>
                    Mark returned
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
