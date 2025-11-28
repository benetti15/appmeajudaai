-- Fase 1: Infraestrutura de Roles

-- 1. Criar tipo ENUM para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Criar função SECURITY DEFINER para verificar roles (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Adicionar políticas RLS para admins visualizarem e atualizarem verification_documents
CREATE POLICY "Admins can view all verification documents"
ON public.verification_documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification documents"
ON public.verification_documents
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Criar tabela de audit logs para rastreabilidade
CREATE TABLE public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.verification_documents(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'rejected'
  previous_status TEXT,
  new_status TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.verification_audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create audit logs"
ON public.verification_audit_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Criar índices para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_verification_audit_logs_document_id ON public.verification_audit_logs(document_id);
CREATE INDEX idx_verification_audit_logs_admin_id ON public.verification_audit_logs(admin_id);