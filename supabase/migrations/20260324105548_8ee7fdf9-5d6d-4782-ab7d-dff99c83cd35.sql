
-- Period logs: one row per day the user is on their period
CREATE TABLE public.period_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  flow text NOT NULL DEFAULT 'medium', -- light, medium, heavy
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.period_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own period logs" ON public.period_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own period logs" ON public.period_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own period logs" ON public.period_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own period logs" ON public.period_logs FOR DELETE USING (auth.uid() = user_id);

-- Medications: recurring meds/pills a user tracks
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '💊',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medications" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medications" ON public.medications FOR DELETE USING (auth.uid() = user_id);

-- Medication logs: daily check-off for each medication
CREATE TABLE public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  taken boolean NOT NULL DEFAULT true,
  taken_at timestamptz DEFAULT now(),
  UNIQUE (user_id, medication_id, date)
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medication logs" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medication logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medication logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medication logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);
