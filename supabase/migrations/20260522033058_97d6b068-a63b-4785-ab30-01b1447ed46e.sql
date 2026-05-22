
CREATE TABLE public.transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  vehicle_no text NOT NULL,
  model text,
  capacity integer NOT NULL DEFAULT 30,
  driver_name text,
  driver_phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY vehicles_select ON public.transport_vehicles FOR SELECT
  USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY vehicles_write ON public.transport_vehicles FOR ALL
  USING (is_super_admin(auth.uid()) OR has_role_in_school(auth.uid(),'school_admin'::app_role,school_id) OR has_role_in_school(auth.uid(),'transport'::app_role,school_id))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role_in_school(auth.uid(),'school_admin'::app_role,school_id) OR has_role_in_school(auth.uid(),'transport'::app_role,school_id));

CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  vehicle_id uuid REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  fare numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY routes_select ON public.transport_routes FOR SELECT
  USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY routes_write ON public.transport_routes FOR ALL
  USING (is_super_admin(auth.uid()) OR has_role_in_school(auth.uid(),'school_admin'::app_role,school_id) OR has_role_in_school(auth.uid(),'transport'::app_role,school_id))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role_in_school(auth.uid(),'school_admin'::app_role,school_id) OR has_role_in_school(auth.uid(),'transport'::app_role,school_id));

CREATE TABLE public.transport_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  pickup_stop text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, student_id)
);
ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_select ON public.transport_assignments FOR SELECT
  USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY assignments_write ON public.transport_assignments FOR ALL
  USING (is_super_admin(auth.uid()) OR has_role_in_school(auth.uid(),'school_admin'::app_role,school_id) OR has_role_in_school(auth.uid(),'transport'::app_role,school_id))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role_in_school(auth.uid(),'school_admin'::app_role,school_id) OR has_role_in_school(auth.uid(),'transport'::app_role,school_id));

CREATE INDEX idx_routes_vehicle ON public.transport_routes(vehicle_id);
CREATE INDEX idx_assignments_route ON public.transport_assignments(route_id);
CREATE INDEX idx_assignments_student ON public.transport_assignments(student_id);
