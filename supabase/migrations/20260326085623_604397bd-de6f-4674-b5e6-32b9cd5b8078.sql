
CREATE TABLE public.period_symptoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptom TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, symptom)
);

ALTER TABLE public.period_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own symptoms" ON public.period_symptoms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own symptoms" ON public.period_symptoms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own symptoms" ON public.period_symptoms FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own symptoms" ON public.period_symptoms FOR UPDATE USING (auth.uid() = user_id);
