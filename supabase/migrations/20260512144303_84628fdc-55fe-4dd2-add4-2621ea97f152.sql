-- Add list_owner_id to grocery_items so multiple users can collaborate on one list
ALTER TABLE public.grocery_items
  ADD COLUMN IF NOT EXISTS list_owner_id uuid;

UPDATE public.grocery_items SET list_owner_id = user_id WHERE list_owner_id IS NULL;

ALTER TABLE public.grocery_items
  ALTER COLUMN list_owner_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grocery_items_list_owner ON public.grocery_items(list_owner_id);

-- Replace RLS policies to grant access to friends a list was shared with
DROP POLICY IF EXISTS "Users can view their own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can insert their own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can update their own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can delete their own grocery items" ON public.grocery_items;

CREATE POLICY "View own or shared grocery items"
ON public.grocery_items FOR SELECT
USING (
  list_owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.shared_items s
    WHERE s.item_type = 'grocery_list'
      AND s.from_user_id = public.grocery_items.list_owner_id
      AND s.to_user_id = auth.uid()
  )
);

CREATE POLICY "Insert into own or shared grocery list"
ON public.grocery_items FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    list_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_items s
      WHERE s.item_type = 'grocery_list'
        AND s.from_user_id = list_owner_id
        AND s.to_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Update own or shared grocery items"
ON public.grocery_items FOR UPDATE
USING (
  list_owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.shared_items s
    WHERE s.item_type = 'grocery_list'
      AND s.from_user_id = public.grocery_items.list_owner_id
      AND s.to_user_id = auth.uid()
  )
);

CREATE POLICY "Delete own or shared grocery items"
ON public.grocery_items FOR DELETE
USING (
  list_owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.shared_items s
    WHERE s.item_type = 'grocery_list'
      AND s.from_user_id = public.grocery_items.list_owner_id
      AND s.to_user_id = auth.uid()
  )
);

-- Enable realtime for live updates between collaborators
ALTER TABLE public.grocery_items REPLICA IDENTITY FULL;
ALTER TABLE public.shared_items REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_items';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_items';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;