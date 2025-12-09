'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

interface CustomPathValidation {
  isValid: boolean;
  isAvailable: boolean;
  message: string | null;
  status: 'checking' | 'available' | 'taken' | 'invalid';
}

export function useCustomPathValidation(path: string, originalPath: string) {
  return useQuery<CustomPathValidation>({
    queryKey: ['custom-path-validation', path],
    queryFn: async (): Promise<CustomPathValidation> => {
      // If the path matches the original path, consider it available
      if (path === originalPath) {
        return {
          isValid: true,
          isAvailable: true,
          message: null,
          status: 'available'
        };
      }

      // Check if empty
      if (!path?.trim()) {
        return {
          isValid: false,
          isAvailable: false,
          message: 'Path cannot be empty',
          status: 'invalid'
        };
      }

      // Check minimum length
      if (path.length < 3) {
        return {
          isValid: false,
          isAvailable: false,
          message: 'Path must be at least 3 characters long',
          status: 'invalid'
        };
      }

      // Check maximum length
      if (path.length > 20) {
        return {
          isValid: false,
          isAvailable: false,
          message: 'Path must be less than 20 characters long',
          status: 'invalid'
        };
      }

      // Check availability
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('custom_path', path);

      if (error) {
        throw error;
      }

      const isAvailable = data.length === 0;
      
      return {
        isValid: isAvailable,
        isAvailable,
        message: isAvailable ? null : 'Path is already taken',
        status: isAvailable ? 'available' : 'taken'
      };
    },
    enabled: !!path && path.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
} 