
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico');

-- Create categories table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);

-- Create items table
CREATE TABLE public.items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(id),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  min_qty INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  maintenance_notes TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items are publicly readable" ON public.items FOR SELECT USING (true);

-- Create movements table
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  qty INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movements are readable by authenticated" ON public.movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Movements are insertable by authenticated" ON public.movements FOR INSERT TO authenticated WITH CHECK (true);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admin policies for items
CREATE POLICY "Admins can insert items" ON public.items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update items" ON public.items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete items" ON public.items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for item photos
INSERT INTO storage.buckets (id, name, public) VALUES ('item-photos', 'item-photos', true);
CREATE POLICY "Item photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'item-photos');
CREATE POLICY "Admins can upload item photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'item-photos');
CREATE POLICY "Admins can update item photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'item-photos');
CREATE POLICY "Admins can delete item photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'item-photos');
