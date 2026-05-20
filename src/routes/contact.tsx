import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Smart School ERP" },
      { name: "description", content: "Talk to the Smart School ERP team about your school." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Thanks! We'll reach out within 1 business day.");
      setSending(false);
      (e.target as HTMLFormElement).reset();
    }, 600);
  };
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-20">
        <h1 className="text-4xl font-bold tracking-tight">Contact us</h1>
        <p className="mt-3 text-muted-foreground">Tell us about your school. We'll set up a demo tailored to you.</p>
        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input required name="name" /></div>
            <div className="space-y-2"><Label>Email</Label><Input required type="email" name="email" /></div>
          </div>
          <div className="space-y-2"><Label>School</Label><Input name="school" /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea required rows={5} name="message" /></div>
          <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send message"}</Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
