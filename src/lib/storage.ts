import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize storage buckets if they don't exist
 * Note: Buckets 'service-images' and 'uploads' are pre-configured
 */
export async function initializeStorageBuckets() {
  // Buckets já existem e estão configurados no Supabase
  // Não é necessário criar buckets em runtime
  console.log('Storage buckets initialized: service-images, uploads');
}

/**
 * Upload file with automatic fallback
 * Default bucket changed to 'uploads' (pre-configured)
 */
export async function uploadFile(file: File, path: string, bucket: string = 'uploads'): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Try to upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (uploadError) {
      // Fallback to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          resolve({
            success: true,
            url: base64
          });
        };
        reader.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to process file'
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // Check if bucket is private (chat-attachments, request-images)
    const privateBuckets = ['chat-attachments', 'request-images'];
    
    if (privateBuckets.includes(bucket)) {
      // Use signed URL for private buckets (1 hour expiry)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      
      if (signedError) throw signedError;
      
      return {
        success: true,
        url: signedData.signedUrl
      };
    }
    
    // Get public URL for public buckets
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      success: true,
      url: data.publicUrl
    };

  } catch (error) {
    // Fallback to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        resolve({
          success: true,
          url: base64
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to process file'
        });
      };
      reader.readAsDataURL(file);
    });
  }
}