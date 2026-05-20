import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Smart School ERP" },
      { name: "description", content: "Simple per-student pricing. Free trial for every school." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  { name: "Starter", price: "Free", desc: "For a single school evaluating the platform.", features: ["Up to 50 students","Core modules","Email support"], cta: "Start free" },
  { name: "Growth", price: "₹15/student/mo", desc: "Most popular — for growing schools.", features: ["Unlimited modules","Online fees & receipts","AI insights","Priority support"], cta: "Start trial", featured: true },
  { name: "Enterprise", price: "Custom", desc: "Multi-school groups and large institutions.", features: ["Multi-school SaaS","SSO / SAML","Dedicated success manager","SLA & on-prem option"], cta: "Contact sales" },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-7 ${t.featured ? "border-primary shadow-xl bg-card" : "border-border bg-card"}`}>
              {t.featured && <div className="text-xs font-medium text-primary mb-2">Most popular</div>}
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <div className="mt-2 text-3xl font-bold">{t.price}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={t.featured ? "default" : "outline"}>
                <Link to={t.name === "Enterprise" ? "/contact" : "/signup"}>{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
