import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Smart School ERP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, roles } = useAuth();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile and access.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div><div className="text-xs uppercase text-muted-foreground">Email</div><div className="font-medium">{profile?.email}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">Full name</div><div className="font-medium">{profile?.full_name ?? "—"}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">School ID</div><div className="font-mono text-xs">{profile?.school_id ?? "—"}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">Roles</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {roles.length === 0 && <span className="text-sm text-muted-foreground">No roles assigned</span>}
            {roles.map(r => <span key={r} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{r}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
