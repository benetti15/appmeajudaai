import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize storage buckets if they don't exist
 */
export async function initializeStorageBuckets() {
  try {
    // Check if public-uploads bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const publicUploadsBucket = buckets?.find(bucket => bucket.name === 'public-uploads');
    
    if (!publicUploadsBucket) {
      // Create the bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('public-uploads', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Public uploads bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
}

/**
 * Upload file with automatic fallback
 */
export async function uploadFile(file: File, path: string, bucket: string = 'public-uploads'): Promise<{
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

    // Get public URL
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