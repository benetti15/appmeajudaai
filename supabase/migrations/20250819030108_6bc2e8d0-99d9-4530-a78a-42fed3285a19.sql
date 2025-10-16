-- Create enum types for better data consistency
CREATE TYPE user_type AS ENUM ('client', 'professional', 'admin');
CREATE TYPE request_status AS ENUM ('pending', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('pix', 'credit_card', 'debit_card');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_type user_type NOT NULL DEFAULT 'client',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  document_number TEXT, -- CPF/CNPJ
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service categories table
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professional specialties junction table
CREATE TABLE public.professional_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, category_id)
);

-- Create service areas for professionals
CREATE TABLE public.service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  radius_km INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  preferred_date TIMESTAMP WITH TIME ZONE,
  urgency_level INTEGER DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 5),
  budget_estimate DECIMAL(10,2),
  status request_status DEFAULT 'pending',
  images_urls TEXT[], -- Array of image URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes/budgets table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  estimated_duration_hours INTEGER,
  materials_included BOOLEAN DEFAULT FALSE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_accepted BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id),
  payer_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id TEXT, -- External payment provider ID
  pix_key TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  images_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'new_request', 'new_quote', 'payment', etc.
  related_id UUID, -- Can reference request_id, quote_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view public professional profiles" ON public.profiles FOR SELECT USING (user_type = 'professional' AND is_active = true);

-- Create RLS policies for service categories
CREATE POLICY "Anyone can view active service categories" ON public.service_categories FOR SELECT USING (is_active = true);

-- Create RLS policies for professional specialties
CREATE POLICY "Anyone can view professional specialties" ON public.professional_specialties FOR SELECT USING (true);
CREATE POLICY "Professionals can manage their own specialties" ON public.professional_specialties FOR ALL USING (auth.uid() = professional_id);

-- Create RLS policies for service areas
CREATE POLICY "Anyone can view service areas" ON public.service_areas FOR SELECT USING (true);
CREATE POLICY "Professionals can manage their own service areas" ON public.service_areas FOR ALL USING (auth.uid() = professional_id);

-- Create RLS policies for service requests
CREATE POLICY "Clients can view their own requests" ON public.service_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can create requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update their own requests" ON public.service_requests FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Professionals can view requests in their areas" ON public.service_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.service_areas sa 
    WHERE sa.professional_id = auth.uid() 
    AND sa.city = service_requests.city 
    AND sa.state = service_requests.state
  )
);

-- Create RLS policies for quotes
CREATE POLICY "Professionals can manage their own quotes" ON public.quotes FOR ALL USING (auth.uid() = professional_id);
CREATE POLICY "Clients can view quotes for their requests" ON public.quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = request_id AND sr.client_id = auth.uid())
);
CREATE POLICY "Clients can update quote acceptance" ON public.quotes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = request_id AND sr.client_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = request_id AND sr.client_id = auth.uid())
);

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = receiver_id);
CREATE POLICY "Payers can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = payer_id);

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for completed requests" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Create RLS policies for chat messages
CREATE POLICY "Users can view messages for their requests" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.service_requests sr 
    WHERE sr.id = request_id 
    AND (sr.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.quotes q 
      WHERE q.request_id = sr.id AND q.professional_id = auth.uid()
    ))
  )
);
CREATE POLICY "Users can send messages for their requests" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.service_requests sr 
    WHERE sr.id = request_id 
    AND (sr.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.quotes q 
      WHERE q.request_id = sr.id AND q.professional_id = auth.uid()
    ))
  )
);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::user_type, 'client')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial service categories
INSERT INTO public.service_categories (name, description) VALUES
('Elétrica', 'Instalação e reparo de sistemas elétricos'),
('Encanamento', 'Serviços hidráulicos e encanamento'),
('Ar Condicionado', 'Instalação e manutenção de ar condicionado'),
('Pequenos Reparos', 'Reparos domésticos diversos'),
('Pintura', 'Serviços de pintura residencial e comercial'),
('Marcenaria', 'Móveis planejados e reparos em madeira'),
('Limpeza', 'Serviços de limpeza residencial e comercial'),
('Jardinagem', 'Manutenção de jardins e áreas verdes');