# Smart School ERP — v1 Foundation

Stack (this Lovable project): **TanStack Start + React 19 + Tailwind + shadcn/ui + Lovable Cloud (Postgres + Auth + Storage + Server Functions)**. Equivalent capability to your Next.js/Prisma/NextAuth list — just a different runtime.

## What ships in this turn

### 1. Backend (Lovable Cloud)
- Enable Lovable Cloud
- Multi-school tenant model — every record scoped by `school_id`
- Tables: `schools`, `profiles`, `user_roles`, `classes`, `sections`, `students`, `guardians`, `student_guardians`, `attendance`, `fee_categories`, `fee_invoices`, `fee_payments`, `exams`, `exam_marks`, `subjects`, `timetable_slots`, `notifications`, `audit_logs`
- Enum `app_role`: `super_admin | school_admin | teacher | student | parent | accountant | transport | staff`
- RLS on every table, scoped by `school_id` + role via `has_role()` security-definer function
- Trigger `handle_new_user()` → auto-create `profiles` row on signup
- Seed data: 1 demo school, 1 admin per role, 3 classes, 12 demo students

### 2. Auth (Lovable Cloud Auth)
- Email/password + Google sign-in (via Lovable broker)
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Session attacher middleware for protected server fns
- `_authenticated` route guard + role-based redirects

### 3. Frontend
- **Cloud White SaaS** palette: `#fafbfc / #e8ecf1 / #3b82f6 / #0f172a`, Inter, soft shadows, rounded-xl
- Pages:
  - `/` Landing (hero, modules grid, pricing teaser, CTA)
  - `/about`, `/pricing`, `/contact`
  - `/login`, `/signup`, `/forgot-password`, `/reset-password`
  - `/app` (role router) → redirects to role dashboard
  - `/app/dashboard` (school admin) — KPI cards, attendance chart (Recharts), revenue chart, recent activity
  - `/app/students` — list + add + profile (full CRUD)
  - `/app/attendance` — class picker + daily mark grid + history
  - `/app/fees` — invoices list + pay action (Razorpay/Stripe deferred to next iteration, UI stubbed)
  - `/app/exams` — schedule list + marks entry (skeleton)
  - `/app/timetable` — weekly grid view (skeleton)
  - `/app/settings/profile`, `/app/settings/school`
- Persistent sidebar (collapsible) + topbar with school switcher (for Super Admin) and profile menu
- Mobile-responsive, dark mode toggle

### 4. Reusable components
- `<DataTable>`, `<PageHeader>`, `<StatCard>`, `<EmptyState>`, `<RoleBadge>`, `<ConfirmDialog>`

## Explicitly deferred (next iterations)
- Razorpay/Stripe live integration, receipt PDFs
- Live classes (Zoom/Meet/Jitsi)
- Transport GPS, Hostel, Library, Gallery modules
- AI features (chatbot, predictions) — via Lovable AI Gateway
- SMS/WhatsApp, push notifications
- PWA/offline, i18n, audit log UI
- Online test engine, practice paper generator

These are real modules — each is a focused follow-up turn so we ship working code instead of stubs.

## After approval
I'll execute in this order: enable Cloud → migration + seed → auth pages → landing → sidebar shell → dashboards → Students CRUD → Attendance → Fees/Exams/Timetable skeletons. Then I'll verify the build and walk you through how to test.

Reply **approve** to start, or tell me what to adjust (e.g. "drop Exams from v1", "add Library instead", "make it single-school").