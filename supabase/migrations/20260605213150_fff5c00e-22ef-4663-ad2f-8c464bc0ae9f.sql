
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  street text,
  postal_code text,
  city text,
  country text NOT NULL DEFAULT 'Deutschland',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MELDEAEMTER DIRECTORY
CREATE TABLE public.meldeaemter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ags text,
  name text NOT NULL,
  street text,
  postal_code text NOT NULL,
  city text NOT NULL,
  email text,
  phone text,
  online_portal_url text,
  accepts_email boolean NOT NULL DEFAULT false,
  fee_einfach_eur numeric(6,2),
  fee_erweitert_eur numeric(6,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meldeaemter_plz_idx ON public.meldeaemter(postal_code);
CREATE INDEX meldeaemter_city_idx ON public.meldeaemter(lower(city));
GRANT SELECT ON public.meldeaemter TO authenticated;
GRANT ALL ON public.meldeaemter TO service_role;
ALTER TABLE public.meldeaemter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read meldeaemter" ON public.meldeaemter FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write meldeaemter" ON public.meldeaemter FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER meldeaemter_updated_at BEFORE UPDATE ON public.meldeaemter FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CASES
CREATE TYPE public.case_status AS ENUM ('draft','submitted','awaiting_reply','answered','negative','refused');
CREATE TYPE public.request_type AS ENUM ('einfach','erweitert');
CREATE TYPE public.submission_channel AS ENUM ('post','email','portal','in_person');
CREATE TYPE public.response_outcome AS ENUM ('address_received','negative','refused','no_reply');

CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  status public.case_status NOT NULL DEFAULT 'draft',
  request_type public.request_type NOT NULL DEFAULT 'einfach',
  meldeamt_id uuid REFERENCES public.meldeaemter(id) ON DELETE SET NULL,
  meldeamt_snapshot jsonb,
  purpose_text text,
  legitimate_interest_text text,
  declared_no_advertising boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  submission_channel public.submission_channel,
  follow_up_at timestamptz,
  fee_paid_eur numeric(6,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages cases" ON public.cases FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX cases_owner_idx ON public.cases(owner_id);

-- CASE SUBJECTS
CREATE TABLE public.case_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_name text,
  date_of_birth date,
  gender text,
  last_known_street text,
  last_known_postal_code text,
  last_known_city text,
  additional_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_subjects TO authenticated;
GRANT ALL ON public.case_subjects TO service_role;
ALTER TABLE public.case_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages subjects" ON public.case_subjects FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- CASE RESPONSES
CREATE TABLE public.case_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome public.response_outcome NOT NULL,
  response_date date,
  current_full_name text,
  current_street text,
  current_postal_code text,
  current_city text,
  current_country text,
  prior_addresses jsonb,
  date_of_death date,
  notes text,
  uploaded_file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_responses TO authenticated;
GRANT ALL ON public.case_responses TO service_role;
ALTER TABLE public.case_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages responses" ON public.case_responses FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- STORAGE policies for case-responses bucket
CREATE POLICY "Owner reads response files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'case-responses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner uploads response files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'case-responses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner updates response files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'case-responses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner deletes response files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'case-responses' AND auth.uid()::text = (storage.foldername(name))[1]);
