import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, BookOpen, Users, ClipboardCheck, Wallet, Calendar,
  GraduationCap, BarChart3, MessageSquare, ShieldCheck, Sparkles, Bus, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const modules = [
  { icon: Users, title: "Student Management", desc: "Admissions, profiles, ID cards, promotion, documents." },
  { icon: ClipboardCheck, title: "Attendance", desc: "Daily, biometric-ready, QR & leave management." },
  { icon: BookOpen, title: "Homework & LMS", desc: "Assignments, study material, submission tracking." },
  { icon: Wallet, title: "Fees & Payments", desc: "Online fees, receipts, discounts, dues alerts." },
  { icon: GraduationCap, title: "Exams & Results", desc: "Marks entry, report cards, grade analytics." },
  { icon: Calendar, title: "Timetable", desc: "Dynamic timetable with conflict detection." },
  { icon: MessageSquare, title: "Parent Portal", desc: "Live progress, fee alerts, two-way messaging." },
  { icon: Bus, title: "Transport", desc: "Routes, drivers, pickup/drop notifications." },
  { icon: Bell, title: "Notifications", desc: "Push, email, SMS & WhatsApp ready." },
  { icon: BarChart3, title: "Analytics", desc: "Real-time KPIs, attendance & revenue trends." },
  { icon: Sparkles, title: "AI Assistant", desc: "Performance insights, AI homework, chatbot." },
  { icon: ShieldCheck, title: "Enterprise Security", desc: "RBAC, RLS, audit logs, role-based access." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="hero-gradient">
        <div className="container mx-auto max-w-6xl px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            New · AI-powered school operations
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
            The modern OS for <span className="gradient-text">smart schools</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Run admissions, attendance, fees, exams, parent communication and AI insights —
            from one beautiful, secure, multi-school platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/signup">Start free trial <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Sign in to demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Multi-school SaaS · RBAC · Audit logs · GDPR-ready</p>
        </div>
      </section>

      {/* Modules grid */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything your school runs on</h2>
          <p className="mt-3 text-muted-foreground">18+ modules covering academics, operations, finance and parent engagement.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div key={m.title} className="glass-card rounded-2xl p-6 transition hover:shadow-lg hover:-translate-y-0.5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Purpose-built dashboards for every role</h2>
              <p className="mt-4 text-muted-foreground">
                Super Admin, School Admin, Teacher, Student, Parent, Accountant, Transport, Staff —
                each role gets the exact tools they need, nothing they don't.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Role-based access control with row-level security",
                  "Multi-school tenancy — manage one school or hundreds",
                  "Audit logs for every change",
                  "Beautiful, responsive UI on every device"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-primary">✓</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-2 gap-3">
                {["Super Admin","School Admin","Teacher","Student","Parent","Accountant","Transport","Staff"].map((r)=>(
                  <div key={r} className="rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to modernize your school?</h2>
        <p className="mt-3 text-muted-foreground">Try the live demo — no credit card required.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/signup">Create your account</Link></Button>
          <Button asChild variant="outline" size="lg"><Link to="/pricing">View pricing</Link></Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
