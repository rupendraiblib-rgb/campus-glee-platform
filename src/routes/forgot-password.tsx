import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Smart School ERP" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link.");
  };
  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 hero-gradient">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-sm text-muted-foreground mt-1">We'll email you a reset link.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
        </form>
        <p className="mt-6 text-sm text-center text-muted-foreground"><Link to="/login" className="text-primary">Back to sign in</Link></p>
      </div>
    </div>
  );
}
