import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { bootstrapUser } from "@/lib/bootstrap.functions";
import {
  LayoutDashboard, Users, ClipboardCheck, Wallet, GraduationCap, Calendar, Settings, LogOut, Bell, BookOpen, Megaphone, Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

const nav = [
  { url: "/dashboard", title: "Dashboard", icon: LayoutDashboard },
  { url: "/students", title: "Students", icon: Users },
  { url: "/academics", title: "Academics", icon: BookOpen },
  { url: "/attendance", title: "Attendance", icon: ClipboardCheck },
  { url: "/fees", title: "Fees", icon: Wallet },
  { url: "/exams", title: "Exams", icon: GraduationCap },
  { url: "/timetable", title: "Timetable", icon: Calendar },
  { url: "/announcements", title: "Announcements", icon: Megaphone },
  { url: "/settings", title: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { profile, signOut } = useAuth();
  const nav2 = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Auto-attach first-time users to the demo school
    bootstrapUser().then((r) => {
      if (r.assigned) toast.success("Welcome! You've been added to the demo school as School Admin.");
    }).catch(() => {});
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="truncate">Smart School</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2 text-xs text-muted-foreground truncate">{profile?.email}</div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:inline">Smart School ERP</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav2({ to: "/" }); }}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
