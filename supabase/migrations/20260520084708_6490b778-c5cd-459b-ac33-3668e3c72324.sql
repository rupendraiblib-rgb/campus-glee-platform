
-- ENUMS
create type public.app_role as enum (
  'super_admin','school_admin','teacher','student','parent','accountant','transport','staff'
);
create type public.attendance_status as enum ('present','absent','late','leave');
create type public.invoice_status as enum ('pending','paid','partial','overdue','cancelled');
create type public.gender_type as enum ('male','female','other');

-- SCHOOLS
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  address text,
  phone text,
  email text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PROFILES (one per auth user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.profiles(school_id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  school_id uuid references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, school_id)
);
create index on public.user_roles(user_id);
create index on public.user_roles(school_id);

-- SECURITY DEFINER role check
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.has_role_in_school(_user_id uuid, _role public.app_role, _school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role and (school_id = _school_id or role = 'super_admin')
  )
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'super_admin')
$$;

create or replace function public.user_school_id(_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = _user_id
$$;

create or replace function public.user_belongs_to_school(_user_id uuid, _school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin(_user_id) or exists (
    select 1 from public.profiles where id = _user_id and school_id = _school_id
  )
$$;

-- CLASSES
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  grade_level int,
  created_at timestamptz not null default now()
);
create index on public.classes(school_id);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on public.sections(class_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);
create index on public.subjects(school_id);

-- STUDENTS
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  admission_no text not null,
  full_name text not null,
  date_of_birth date,
  gender public.gender_type,
  address text,
  phone text,
  email text,
  photo_url text,
  class_id uuid references public.classes(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  roll_no text,
  admission_date date default current_date,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, admission_no)
);
create index on public.students(school_id);
create index on public.students(class_id);

-- GUARDIANS
create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  relation text,
  phone text,
  email text,
  occupation text,
  created_at timestamptz not null default now()
);

create table public.student_guardians (
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  is_primary boolean default false,
  primary key (student_id, guardian_id)
);

-- ATTENDANCE
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  date date not null,
  status public.attendance_status not null default 'present',
  remarks text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
create index on public.attendance(school_id, date);
create index on public.attendance(student_id);

-- FEES
create table public.fee_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  amount numeric(10,2) not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  category_id uuid references public.fee_categories(id) on delete set null,
  invoice_no text not null,
  amount numeric(10,2) not null,
  due_date date,
  status public.invoice_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, invoice_no)
);
create index on public.fee_invoices(school_id);
create index on public.fee_invoices(student_id);

create table public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  amount numeric(10,2) not null,
  method text default 'cash',
  reference text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null
);

-- EXAMS
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  exam_date date,
  max_marks numeric(6,2) default 100,
  pass_marks numeric(6,2) default 35,
  created_at timestamptz not null default now()
);

create table public.exam_marks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks numeric(6,2) not null default 0,
  grade text,
  remarks text,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

-- TIMETABLE
create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid references auth.users(id) on delete set null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id);

-- AUDIT LOG
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_schools_updated before update on public.schools for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_students_updated before update on public.students for each row execute function public.set_updated_at();
create trigger trg_invoices_updated before update on public.fee_invoices for each row execute function public.set_updated_at();

-- handle_new_user trigger creates a profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ENABLE RLS on all tables
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.attendance enable row level security;
alter table public.fee_categories enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.fee_payments enable row level security;
alter table public.exams enable row level security;
alter table public.exam_marks enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- SCHOOLS policies
create policy "schools_select" on public.schools for select using (
  public.is_super_admin(auth.uid()) or id = public.user_school_id(auth.uid())
);
create policy "schools_super_all" on public.schools for all using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create policy "schools_admin_update" on public.schools for update using (
  public.has_role_in_school(auth.uid(), 'school_admin', id)
);

-- PROFILES policies
create policy "profile_self_select" on public.profiles for select using (
  auth.uid() = id or public.is_super_admin(auth.uid()) or school_id = public.user_school_id(auth.uid())
);
create policy "profile_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profile_self_insert" on public.profiles for insert with check (auth.uid() = id);

-- USER_ROLES policies
create policy "roles_self_select" on public.user_roles for select using (
  user_id = auth.uid() or public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);
create policy "roles_admin_manage" on public.user_roles for all using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

-- Helper macro: generic "same school" policies
-- CLASSES
create policy "classes_select" on public.classes for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "classes_admin_write" on public.classes for all using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

-- SECTIONS
create policy "sections_select" on public.sections for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "sections_admin_write" on public.sections for all using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

-- SUBJECTS
create policy "subjects_select" on public.subjects for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "subjects_admin_write" on public.subjects for all using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

-- STUDENTS
create policy "students_select" on public.students for select using (
  public.user_belongs_to_school(auth.uid(), school_id) or user_id = auth.uid()
);
create policy "students_admin_write" on public.students for all using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

-- GUARDIANS
create policy "guardians_select" on public.guardians for select using (public.user_belongs_to_school(auth.uid(), school_id) or user_id = auth.uid());
create policy "guardians_admin_write" on public.guardians for all using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

create policy "sg_select" on public.student_guardians for select using (true);
create policy "sg_admin_write" on public.student_guardians for all using (
  public.is_super_admin(auth.uid()) or public.has_role(auth.uid(), 'school_admin')
) with check (
  public.is_super_admin(auth.uid()) or public.has_role(auth.uid(), 'school_admin')
);

-- ATTENDANCE
create policy "attendance_select" on public.attendance for select using (
  public.user_belongs_to_school(auth.uid(), school_id)
);
create policy "attendance_teacher_write" on public.attendance for all using (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'teacher', school_id)
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'teacher', school_id)
);

-- FEES
create policy "fee_cat_select" on public.fee_categories for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "fee_cat_write" on public.fee_categories for all using (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'accountant', school_id)
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'accountant', school_id)
);

create policy "invoice_select" on public.fee_invoices for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "invoice_write" on public.fee_invoices for all using (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'accountant', school_id)
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'accountant', school_id)
);

create policy "payment_select" on public.fee_payments for select using (true);
create policy "payment_write" on public.fee_payments for all using (
  public.is_super_admin(auth.uid())
  or public.has_role(auth.uid(), 'school_admin')
  or public.has_role(auth.uid(), 'accountant')
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role(auth.uid(), 'school_admin')
  or public.has_role(auth.uid(), 'accountant')
);

-- EXAMS
create policy "exams_select" on public.exams for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "exams_write" on public.exams for all using (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'teacher', school_id)
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
  or public.has_role_in_school(auth.uid(), 'teacher', school_id)
);

create policy "marks_select" on public.exam_marks for select using (true);
create policy "marks_write" on public.exam_marks for all using (
  public.is_super_admin(auth.uid())
  or public.has_role(auth.uid(), 'school_admin')
  or public.has_role(auth.uid(), 'teacher')
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role(auth.uid(), 'school_admin')
  or public.has_role(auth.uid(), 'teacher')
);

-- TIMETABLE
create policy "tt_select" on public.timetable_slots for select using (public.user_belongs_to_school(auth.uid(), school_id));
create policy "tt_write" on public.timetable_slots for all using (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
) with check (
  public.is_super_admin(auth.uid())
  or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);

-- NOTIFICATIONS
create policy "notif_select" on public.notifications for select using (user_id = auth.uid() or public.is_super_admin(auth.uid()));
create policy "notif_update" on public.notifications for update using (user_id = auth.uid());
create policy "notif_insert" on public.notifications for insert with check (
  public.is_super_admin(auth.uid()) or public.has_role(auth.uid(), 'school_admin')
);

-- AUDIT
create policy "audit_select" on public.audit_logs for select using (
  public.is_super_admin(auth.uid()) or public.has_role_in_school(auth.uid(), 'school_admin', school_id)
);
create policy "audit_insert" on public.audit_logs for insert with check (auth.uid() is not null);
