import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminUserIds() {
  return useQuery({
    queryKey: ['admin-user-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (error) throw error;
      return (data || []).map((r) => r.user_id);
    },
    staleTime: 5 * 60 * 1000,
  });
}
