import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserPreferences {
  preferred_categories?: string[];
  typical_budget_range?: { min: number; max: number };
  preferred_times?: string[];
  communication_style?: 'formal' | 'casual';
  default_urgency?: 'low' | 'medium' | 'high';
}

interface UserPatterns {
  request_frequency?: string;
  favorite_professionals?: string[];
  common_issues?: string[];
  frequent_addresses?: any[];
}

interface UserMemory {
  preferences: UserPreferences;
  patterns: UserPatterns;
}

export const useUserMemory = () => {
  const { user } = useAuth();
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMemory();
    }
  }, [user]);

  const loadMemory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_user_memory')
        .select('preferences, patterns')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMemory({
          preferences: data.preferences as UserPreferences,
          patterns: data.patterns as UserPatterns,
        });
      } else {
        // Create initial memory
        await createMemory();
      }
    } catch (error) {
      console.error('Error loading user memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMemory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_user_memory')
        .insert({
          user_id: user.id,
          preferences: {},
          patterns: {},
        });

      if (error) throw error;

      setMemory({ preferences: {}, patterns: {} });
    } catch (error) {
      console.error('Error creating user memory:', error);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!user || !memory) return;

    const updatedPreferences = { ...memory.preferences, [key]: value };

    try {
      const { error } = await supabase
        .from('ai_user_memory')
        .update({ preferences: updatedPreferences })
        .eq('user_id', user.id);

      if (error) throw error;

      setMemory({ ...memory, preferences: updatedPreferences });
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  const updatePattern = async (key: keyof UserPatterns, value: any) => {
    if (!user || !memory) return;

    const updatedPatterns = { ...memory.patterns, [key]: value };

    try {
      const { error } = await supabase
        .from('ai_user_memory')
        .update({ patterns: updatedPatterns })
        .eq('user_id', user.id);

      if (error) throw error;

      setMemory({ ...memory, patterns: updatedPatterns });
    } catch (error) {
      console.error('Error updating pattern:', error);
    }
  };

  return {
    memory,
    loading,
    updatePreference,
    updatePattern,
    refresh: loadMemory,
  };
};
