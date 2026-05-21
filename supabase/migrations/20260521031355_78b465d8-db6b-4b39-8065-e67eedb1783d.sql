-- Library books catalog
CREATE TABLE public.library_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "books_select" ON public.library_books
  FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "books_write" ON public.library_books
  FOR ALL USING (
    is_super_admin(auth.uid())
    OR has_role_in_school(auth.uid(), 'school_admin'::app_role, school_id)
    OR has_role_in_school(auth.uid(), 'staff'::app_role, school_id)
  ) WITH CHECK (
    is_super_admin(auth.uid())
    OR has_role_in_school(auth.uid(), 'school_admin'::app_role, school_id)
    OR has_role_in_school(auth.uid(), 'staff'::app_role, school_id)
  );

CREATE TRIGGER set_library_books_updated_at
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_library_books_school ON public.library_books(school_id);

-- Book loans
CREATE TYPE public.loan_status AS ENUM ('issued', 'returned', 'overdue');

CREATE TABLE public.book_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  book_id UUID NOT NULL,
  student_id UUID NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status loan_status NOT NULL DEFAULT 'issued',
  issued_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.book_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loans_select" ON public.book_loans
  FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "loans_write" ON public.book_loans
  FOR ALL USING (
    is_super_admin(auth.uid())
    OR has_role_in_school(auth.uid(), 'school_admin'::app_role, school_id)
    OR has_role_in_school(auth.uid(), 'staff'::app_role, school_id)
  ) WITH CHECK (
    is_super_admin(auth.uid())
    OR has_role_in_school(auth.uid(), 'school_admin'::app_role, school_id)
    OR has_role_in_school(auth.uid(), 'staff'::app_role, school_id)
  );

CREATE INDEX idx_book_loans_book ON public.book_loans(book_id);
CREATE INDEX idx_book_loans_student ON public.book_loans(student_id);
CREATE INDEX idx_book_loans_status ON public.book_loans(status);