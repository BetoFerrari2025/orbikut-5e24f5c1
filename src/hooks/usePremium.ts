import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsPremium() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-premium', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc('is_premium', { _user_id: user.id });
      return !!data;
    },
    enabled: !!user,
  });
}

export function useAdminSetPremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const { error } = await supabase.rpc('admin_set_premium' as any, {
        _user_id: userId,
        _plan: plan,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['is-premium'] });
    },
  });
}
