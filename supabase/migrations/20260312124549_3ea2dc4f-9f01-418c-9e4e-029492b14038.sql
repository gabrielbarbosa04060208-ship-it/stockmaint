
-- Make movements policies more specific - drop and recreate
DROP POLICY "Movements are insertable by authenticated" ON public.movements;
CREATE POLICY "Authenticated users can insert movements" ON public.movements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow public read on movements for dashboard (optional, keep auth only)
-- Movements also need to be publicly readable for the item detail page context
CREATE POLICY "Movements are publicly readable" ON public.movements FOR SELECT USING (true);
DROP POLICY "Movements are readable by authenticated" ON public.movements;
