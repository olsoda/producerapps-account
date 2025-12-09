import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    // User is logged in, redirect to the dashboard
    redirect('/dashboard');
  } else {
    // User is not logged in, redirect to the login page
    redirect('/login');
  }

  // This is a server component, so we don't need to return any JSX
  return null;
}
