-- Read-only access for recipients of shared workouts/meals/items
CREATE POLICY "View workouts shared with me"
ON public.workouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_items s
    WHERE s.item_type = 'workout'
      AND s.item_id = public.workouts.id
      AND s.to_user_id = auth.uid()
  )
);

CREATE POLICY "View meals shared with me"
ON public.meals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_items s
    WHERE s.item_type = 'meal'
      AND s.item_id = public.meals.id
      AND s.to_user_id = auth.uid()
  )
);

CREATE POLICY "View items shared with me"
ON public.items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_items s
    WHERE s.item_type = 'item'
      AND s.item_id = public.items.id
      AND s.to_user_id = auth.uid()
  )
);