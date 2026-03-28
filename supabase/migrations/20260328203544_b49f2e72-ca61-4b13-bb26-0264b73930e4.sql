
CREATE TABLE public.grocery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  checked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grocery items" ON public.grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own grocery items" ON public.grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own grocery items" ON public.grocery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own grocery items" ON public.grocery_items FOR DELETE USING (auth.uid() = user_id);
