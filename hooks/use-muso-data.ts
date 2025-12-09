'use client';

import { useQuery } from '@tanstack/react-query';

interface MusoData {
  profile: any;
  charts: any;
  profileId: string;
  isValid?: boolean;
  error?: string;
}

interface MusoProfile {
  id: string;
  name: string;
  city: string;
  country: string;
  bio: string;
}



export function useMusoData(profileId?: string | null) {
  return useQuery<MusoData>({
    queryKey: ['muso-data', profileId || 'user-profile'],
    queryFn: async () => {
      // Build URL - if profileId provided, use it for validation, otherwise get user's profile
      const url = profileId?.trim() 
        ? `/api/muso?profileId=${encodeURIComponent(profileId.trim())}`
        : '/api/muso';
        
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    retry: 1, // Reduce retries for validation calls
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Always enabled - if no profileId, fetch user's profile; if profileId provided, validate it
  });
}

