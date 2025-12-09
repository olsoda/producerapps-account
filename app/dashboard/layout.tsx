import DesktopLayout from './DesktopLayout';
import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { createClient } from '@/utils/supabase/server';
import { getUserPlanInfo } from '@/utils/userplan';
import { UserProvider } from '@/context/UserContext';
import { PlanProvider } from '@/context/PlanContext';

export const metadata: Metadata = {
  title: 'Account Dashboard',
  description: 'Manage your ProducerApps account, billing, and profile'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Bootstrap user and plan on the server to avoid duplicate client fetching
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Plan info defaults to free if no user
  const planInfo = user
    ? await getUserPlanInfo(user.id)
    : ({
        plan: 'free',
        limits: {
          songLimit: 3,
          playerLimit: 1,
          landingPageLimit: 1,
          quickClipLimit: 10
        },
        usage: {
          songCount: 0,
          playerCount: 0,
          landingPageCount: 0,
          quickClipCount: 0
        },
        isOverLimit: {
          songs: false,
          players: false,
          landingPages: false,
          quickClips: false
        },
        hasAffiliateCode: false
      } as any);

  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <UserProvider user={user}>
          <PlanProvider planInfo={planInfo}>
            <DesktopLayout>{children}</DesktopLayout>
          </PlanProvider>
        </UserProvider>
      </ThemeProvider>
    </>
  );
}
