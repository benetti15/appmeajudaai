import { useAuth } from "@/hooks/useAuth";

export type UserType = 'client' | 'professional' | null;

interface UseUserTypeReturn {
  userType: UserType;
  isClient: boolean;
  isProfessional: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook centralizado para determinar o tipo de usuário.
 * Usado para controle de acesso baseado em papel (RBAC).
 */
export function useUserType(): UseUserTypeReturn {
  const { user, profile, loading } = useAuth();
  
  const userType = (profile?.user_type as UserType) || null;
  
  return {
    userType,
    isClient: userType === 'client',
    isProfessional: userType === 'professional',
    isLoading: loading,
    isAuthenticated: !!user,
  };
}
