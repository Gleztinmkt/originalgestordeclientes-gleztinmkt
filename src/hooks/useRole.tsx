import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export const useRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setRole(profile.role);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const isSuperAdmin = role === 'super_admin';
  const isAgencyOwner = role === 'agency_owner';
  const isMarketingManager = role === 'marketing_manager';
  const isDesigner = role === 'designer';
  const isFilmingCrew = role === 'filming_crew';

  return {
    role,
    loading,
    isSuperAdmin,
    isAgencyOwner,
    isMarketingManager,
    isDesigner,
    isFilmingCrew,
  };
};