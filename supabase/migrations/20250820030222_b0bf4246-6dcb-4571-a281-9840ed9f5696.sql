-- Fix security vulnerability: Restrict leads access to authorized personnel only

-- First, add admin role to user_type enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('client', 'professional', 'admin');
    ELSE
        -- Check if admin already exists in the enum
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_type' AND e.enumlabel = 'admin') THEN
            ALTER TYPE user_type ADD VALUE 'admin';
        END IF;
    END IF;
END $$;

-- Drop the insecure policy that allows all authenticated users to view leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

-- Create a secure policy that only allows admins to view leads
CREATE POLICY "Only admins can view leads" 
ON public.leads 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- Create a policy for admins to manage leads (update/delete if needed)
CREATE POLICY "Only admins can manage leads" 
ON public.leads 
FOR ALL
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- Keep the public insert policy for lead generation forms
-- This allows potential customers to submit leads through public forms