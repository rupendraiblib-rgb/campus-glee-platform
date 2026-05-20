import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Exams — Smart School ERP" }] }),
  component: ExamsPage,
});

function ExamsPage() {
  const { data } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams").select("id, name, exam_date, max_marks, classes(name), subjects(name)").order("exam_date");
      if (error) throw error; return data;
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
        <p className="text-sm text-muted-foreground">Schedule exams and enter marks. Report-card PDF generation is on the roadmap.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Exam</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Date</th><th className="p-3">Max</th></tr>
          </thead>
          <tbody>
            {(data?.length ?? 0) === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No exams scheduled yet.</td></tr>}
            {data?.map((e: any) => (
              <tr key={e.id} className="border-t border-border">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3">{e.classes?.name ?? "—"}</td>
                <td className="p-3">{e.subjects?.name ?? "—"}</td>
                <td className="p-3">{e.exam_date ?? "—"}</td>
                <td className="p-3">{e.max_marks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
