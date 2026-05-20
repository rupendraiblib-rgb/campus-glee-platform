import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Smart School ERP" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 hero-gradient">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-xl">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></span>
          Smart School ERP
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Sign in to your dashboard.</p>
        <Button onClick={google} variant="outline" className="mt-6 w-full">Continue with Google</Button>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center"><Label>Password</Label><Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link></div>
            <Input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here? <Link to="/signup" className="text-primary font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
