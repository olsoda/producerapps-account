import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent';

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return (
    <DashboardContent
      userName={
        user.user_metadata?.name || user.email?.split('@')[0] || 'there'
      }
    />
  );
}
