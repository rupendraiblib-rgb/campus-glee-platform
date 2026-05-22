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
import { Plus, Trash2, Bus, Route as RouteIcon, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/transport")({
  head: () => ({ meta: [{ title: "Transport — Smart School ERP" }] }),
  component: TransportPage,
});

function TransportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transport</h1>
        <p className="text-sm text-muted-foreground">Manage vehicles, routes, and student pickup assignments.</p>
      </div>
      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles"><Bus className="h-4 w-4 mr-1" />Vehicles</TabsTrigger>
          <TabsTrigger value="routes"><RouteIcon className="h-4 w-4 mr-1" />Routes</TabsTrigger>
          <TabsTrigger value="assignments"><UsersIcon className="h-4 w-4 mr-1" />Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="mt-4"><VehiclesTab /></TabsContent>
        <TabsContent value="routes" className="mt-4"><RoutesTab /></TabsContent>
        <TabsContent value="assignments" className="mt-4"><AssignmentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function VehiclesTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicle_no: "", model: "", capacity: "30", driver_name: "", driver_phone: "" });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["transport-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transport_vehicles").select("*").order("vehicle_no");
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = async () => {
    if (!profile?.school_id || !form.vehicle_no.trim()) return;
    const { error } = await supabase.from("transport_vehicles").insert({
      school_id: profile.school_id,
      vehicle_no: form.vehicle_no.trim(),
      model: form.model || null,
      capacity: Number(form.capacity) || 30,
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Vehicle added");
    setOpen(false);
    setForm({ vehicle_no: "", model: "", capacity: "30", driver_name: "", driver_phone: "" });
    qc.invalidateQueries({ queryKey: ["transport-vehicles"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("transport_vehicles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["transport-vehicles"] });
    qc.invalidateQueries({ queryKey: ["transport-routes"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add Vehicle</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Vehicle Number *</Label><Input value={form.vehicle_no} onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })} placeholder="MH 12 AB 1234" /></div>
              <div><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Tata Starbus" /></div>
              <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              <div><Label>Driver Name</Label><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></div>
              <div><Label>Driver Phone</Label><Input value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={add}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v: any) => (
          <div key={v.id} className="rounded-lg border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{v.vehicle_no}</div>
                <div className="text-xs text-muted-foreground">{v.model || "—"}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="text-sm">Capacity: {v.capacity}</div>
            {v.driver_name && <div className="text-sm">Driver: {v.driver_name}{v.driver_phone ? ` · ${v.driver_phone}` : ""}</div>}
          </div>
        ))}
        {vehicles.length === 0 && <div className="text-sm text-muted-foreground col-span-full">No vehicles yet.</div>}
      </div>
    </div>
  );
}

function RoutesTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", vehicle_id: "", fare: "0" });

  const { data: routes = [] } = useQuery({
    queryKey: ["transport-routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_routes")
        .select("*, transport_vehicles(vehicle_no, model)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["transport-vehicles"],
    queryFn: async () => {
      const { data } = await supabase.from("transport_vehicles").select("id, vehicle_no").order("vehicle_no");
      return data ?? [];
    },
  });

  const add = async () => {
    if (!profile?.school_id || !form.name.trim()) return;
    const { error } = await supabase.from("transport_routes").insert({
      school_id: profile.school_id,
      name: form.name.trim(),
      description: form.description || null,
      vehicle_id: form.vehicle_id || null,
      fare: Number(form.fare) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Route added");
    setOpen(false);
    setForm({ name: "", description: "", vehicle_id: "", fare: "0" });
    qc.invalidateQueries({ queryKey: ["transport-routes"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("transport_routes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["transport-routes"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add Route</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Route</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Route Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Route A - North" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Stops covered..." /></div>
              <div>
                <Label>Assigned Vehicle</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.vehicle_no}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Monthly Fare</Label><Input type="number" value={form.fare} onChange={(e) => setForm({ ...form, fare: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={add}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((r: any) => (
          <div key={r.id} className="rounded-lg border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{r.name}</div>
                {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="text-sm flex items-center gap-2 mt-1">
              {r.transport_vehicles ? <Badge variant="secondary">{r.transport_vehicles.vehicle_no}</Badge> : <Badge variant="outline">No vehicle</Badge>}
              <span className="text-muted-foreground">Fare: ₹{Number(r.fare ?? 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
        {routes.length === 0 && <div className="text-sm text-muted-foreground col-span-full">No routes yet.</div>}
      </div>
    </div>
  );
}

function AssignmentsTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ route_id: "", student_id: "", pickup_stop: "" });

  const { data: routes = [] } = useQuery({
    queryKey: ["transport-routes-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("transport_routes").select("id, name").order("name");
      return data ?? [];
    },
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id, full_name, admission_no").order("full_name");
      return data ?? [];
    },
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["transport-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_assignments")
        .select("*, transport_routes(name), students(full_name, admission_no)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = async () => {
    if (!profile?.school_id || !form.route_id || !form.student_id) {
      return toast.error("Route and student are required");
    }
    const { error } = await supabase.from("transport_assignments").insert({
      school_id: profile.school_id,
      route_id: form.route_id,
      student_id: form.student_id,
      pickup_stop: form.pickup_stop || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Student assigned");
    setForm({ route_id: "", student_id: "", pickup_stop: "" });
    qc.invalidateQueries({ queryKey: ["transport-assignments"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("transport_assignments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["transport-assignments"] });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 grid gap-3 md:grid-cols-4">
        <div>
          <Label>Route</Label>
          <Select value={form.route_id} onValueChange={(v) => setForm({ ...form, route_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
            <SelectContent>
              {routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Student</Label>
          <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Pickup Stop</Label>
          <Input value={form.pickup_stop} onChange={(e) => setForm({ ...form, pickup_stop: e.target.value })} placeholder="e.g. Main Gate" />
        </div>
        <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4 mr-1" />Assign</Button></div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Student</th>
              <th className="p-3">Route</th>
              <th className="p-3">Pickup Stop</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.students?.full_name} <span className="text-muted-foreground text-xs">({a.students?.admission_no})</span></td>
                <td className="p-3">{a.transport_routes?.name}</td>
                <td className="p-3">{a.pickup_stop || "—"}</td>
                <td className="p-3"><Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No assignments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
