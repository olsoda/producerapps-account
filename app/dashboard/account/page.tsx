// path = /dashboard/account/page.tsx
import CustomerPortalForm from '@/components/CustomerPortalForm';
import EmailForm from '@/components/template_ui/AccountForms/EmailForm';
import NameForm from '@/components/template_ui/AccountForms/NameForm';
import MusoProfileForm from '@/components/template_ui/AccountForms/MusoProfileForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Pricing from '@/components/Pricing/Pricing';
import PasswordResetForm from '@/components/PasswordResetForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PaymentMethodManager from '@/components/PaymentMethodManager';
import { Suspense } from 'react';
import { getUserPlanInfo } from '@/utils/userplan';
import { Music, Speaker, FileText, ArrowRight, FileVolume } from 'lucide-react';
import Link from 'next/link';

// Usage Card component (reused from dashboard)
function UsageCard({
  title,
  current,
  limit,
  isOverLimit,
  icon: Icon,
  href
}: {
  title: string;
  current: number;
  limit: number;
  isOverLimit: boolean;
  icon: any;
  href: string;
}) {
  const percentage = (current / limit) * 100;

  return (
    <Card
      className={
        isOverLimit
          ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/50'
          : ''
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {current}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {limit}
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            indicatorColor={
              isOverLimit
                ? 'bg-red-500'
                : current === limit
                  ? 'bg-yellow-500'
                  : 'bg-primary'
            }
          />
          {/* <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={href}>
              Manage {title}
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function Account() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Redirect if no user
  if (!user) {
    redirect('/auth');
  }

  // Fetch user plan information
  const planInfo = await getUserPlanInfo(user.id);

  // Fetch user data including Muso profile ID
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('muso_profile_id')
    .eq('id', user.id)
    .single();

  // Fetch subscription details
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .or('status.eq.trialing,status.eq.active')
    .maybeSingle();

  if (error) {
    console.log(error);
  }

  // Fetch products data
  const { data: products } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { foreignTable: 'prices' });

  // Determine if the user is in a trial period
  const planStatus = subscription?.status?.toString();

  // Get the trial end date
  const trialEndDate = subscription?.trial_end;

  const { usage, limits, isOverLimit } = planInfo;

  return (
    <section className="">
      <div className="flex flex-col space-y-6 max-w-screen-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold">Account</h1>
          <p className="text-muted-foreground">
            You can manage your account settings here. For more help or details
            about our billing policies, check out our{' '}
            <a
              href="https://docs.mixflip.io/billing/policies/"
              target="_blank"
              className="text-primary"
            >
              billing documentation
            </a>
            .
          </p>
        </div>

        {/* Usage Stats Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Current Usage</CardTitle>
            <CardDescription>
              You can manage your usage limits and upgrade your plan below. To
              view our pricing,{' '}
              <Link
                href="https://mixflip.io/pricing"
                target="_blank"
                className="text-primary"
              >
                click here
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <UsageCard
              title="Songs"
              current={usage.songCount}
              limit={limits.songLimit}
              isOverLimit={isOverLimit.songs}
              icon={Music}
              href="https://mixflip.producerapps.com/dashboard/songs"
            />

            <UsageCard
              title="Players"
              current={usage.playerCount}
              limit={limits.playerLimit}
              isOverLimit={isOverLimit.players}
              icon={Speaker}
              href="https://mixflip.producerapps.com/dashboard/players"
            />
            <UsageCard
              title="QuickClips"
              current={usage.quickClipCount}
              limit={limits.quickClipLimit}
              isOverLimit={isOverLimit.quickClips}
              icon={FileVolume}
              href="https://mixflip.producerapps.com/dashboard/quick-clips"
            />
            <UsageCard
              title="Landing Pages"
              current={usage.landingPageCount}
              limit={limits.landingPageLimit}
              isOverLimit={isOverLimit.landingPages}
              icon={FileText}
              href="https://mixflip.producerapps.com/dashboard/landing-pages"
            />
          </CardContent>
        </Card>

        <Suspense fallback={<div>Loading...</div>}>
          <Pricing
            user={user}
            products={products ?? []}
            subscription={subscription}
          />
        </Suspense>

        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full mb-4 md:mb-0 md:w-1/2">
            <Suspense fallback={<div>Loading...</div>}>
              <CustomerPortalForm
                subscription={subscription}
                products={products ?? []} // Add nullish coalescing operator to provide an empty array as fallback
                user={user}
                planStatus={planStatus}
                trialEndDate={trialEndDate}
              />
            </Suspense>
          </div>

          <div className="w-full md:w-1/2">
            <NameForm
              firstName={user?.user_metadata?.first_name}
              lastName={user?.user_metadata?.last_name}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2">
            <EmailForm userEmail={user?.email} />
          </div>
          <div className="w-full md:w-1/2">
            <PasswordResetForm />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Muso Profile</CardTitle>
                <CardDescription>
                  Connect your Muso.AI profile to display analytics on your
                  landing pages.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <MusoProfileForm />
              </CardContent>
            </Card>
          </div>
          <div className="w-full md:w-1/2">
            {/* Space for future additional form */}
          </div>
        </div>
      </div>
    </section>
  );
}
