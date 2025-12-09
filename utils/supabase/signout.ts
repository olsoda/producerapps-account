// utils/supabase/signout.ts
import { createClient } from '@/utils/supabase/client';

export const signOut = async () => {
  const supabase = createClient();

  try {
    // Call the API route to sign out the user
    const response = await fetch('/api/signout', {
      method: 'POST'
    });

    if (response.ok) {
      // Clear client-side data
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    } else {
      const errorData = await response.json();
      console.error('Error signing out:', errorData.error);
    }
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
