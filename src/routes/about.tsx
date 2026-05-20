import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Smart School ERP" },
      { name: "description", content: "Why Smart School ERP exists and the team building it." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-bold tracking-tight">About Smart School ERP</h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Schools deserve software that's as modern as the classrooms they run.
          Smart School ERP brings academics, operations, communication and AI together
          in one secure, beautifully designed platform.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { k: "18+", v: "Modules" },
            { k: "8", v: "Roles" },
            { k: "100%", v: "Cloud-native" },
          ].map((s) => (
            <div key={s.v} className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text">{s.k}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-14 text-2xl font-semibold">Our mission</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Give every school — from a single campus to a 100-school group — the tools they
          need to deliver great education, without the IT overhead.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
