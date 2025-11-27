import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface VerificationDocument {
  id: string;
  professional_id: string;
  document_type: 'id' | 'address' | 'professional' | 'background';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationStatus {
  professional_id: string;
  is_verified: boolean;
  verification_level: 'unverified' | 'partial' | 'verified';
  verified_at?: string;
}

export function useVerificationDocuments() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const uploadDocument = async (file: File, documentType: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(fileName, 365 * 24 * 60 * 60); // 1 year

      if (urlError) throw urlError;

      // Save document record to database
      const { error: dbError } = await supabase
        .from('verification_documents')
        .upsert({
          professional_id: user.id,
          document_type: documentType,
          file_url: signedUrlData.signedUrl,
          status: 'pending'
        }, {
          onConflict: 'professional_id,document_type'
        });

      if (dbError) throw dbError;

      toast.success('Documento enviado para análise!');
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erro ao enviar documento');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const fetchDocuments = async (): Promise<VerificationDocument[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'id' | 'address' | 'professional' | 'background',
        status: doc.status as 'pending' | 'approved' | 'rejected'
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erro ao carregar documentos');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async (): Promise<VerificationStatus | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('professional_verification_status')
        .select('*')
        .eq('professional_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? {
        ...data,
        verification_level: data.verification_level as 'unverified' | 'partial' | 'verified'
      } : null;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      return null;
    }
  };

  return {
    uploadDocument,
    fetchDocuments,
    fetchVerificationStatus,
    uploading,
    loading
  };
}
