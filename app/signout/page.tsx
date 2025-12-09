import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function SignOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
  }

  redirect('/');
}
