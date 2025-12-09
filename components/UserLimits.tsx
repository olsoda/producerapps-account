// userLimits.tsx
'use client';
import { useCallback, useEffect } from 'react';
import { useToast } from '@/components/template_ui/TemplateToasts/use-toast';
import { Progress } from '@/components/ui/progress';
import { memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlan } from '@/context/PlanContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const UserLimits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const planInfo = usePlan();

  const error = null;
  const isLoading = false;

  useEffect(() => {
    if (planInfo?.isOverLimit.songs) {
      toast({
        title: 'Song Limit Exceeded',
        description: `You have exceeded your song limit of ${planInfo.limits.songLimit}. Please delete some songs or upgrade your plan.`,
        variant: 'destructive',
        duration: 10000
      });
    }

    if (planInfo?.isOverLimit.players) {
      toast({
        title: 'Player Limit Exceeded',
        description: `You have exceeded your player limit of ${planInfo.limits.playerLimit}. Please remove some players or upgrade your plan.`,
        variant: 'destructive',
        duration: 10000
      });
    }

    if (planInfo?.isOverLimit.landingPages) {
      toast({
        title: 'Landing Page Limit Exceeded',
        description: `You have exceeded your landing page limit of ${planInfo.limits.landingPageLimit}. Please remove some landing pages or upgrade your plan.`,
        variant: 'destructive',
        duration: 10000
      });
    }
  }, [planInfo, toast]);

  useEffect(() => {
    const handleRevalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['userPlanInfo'] });
    };

    window.addEventListener('revalidateUserLimits', handleRevalidate);

    return () => {
      window.removeEventListener('revalidateUserLimits', handleRevalidate);
    };
  }, [queryClient]);

  if (error) {
    return (
      <div className="user-limits">
        <h3>Your Plan</h3>
        <p>Error loading plan information.</p>
      </div>
    );
  }

  if (isLoading || !planInfo) {
    return (
      <div className="user-limits">
        <h3 className="font-semibold">Your Plan</h3>
        <p>Loading plan information...</p>
      </div>
    );
  }

  const planName =
    planInfo.plan.charAt(0).toUpperCase() + planInfo.plan.slice(1);

  return (
    <div className="user-limits">
      {/* if the user is over their limits, show a message */}
      {planInfo.isOverLimit.songs && (
        <div className="p-3 my-4 text-sm bg-red-100 border border-red-200 rounded-md">
          <p className="text-red-700">
            You have exceeded your song limit of {planInfo.limits.songLimit}.
            Your players will be disabled until you delete some songs or upgrade
            your plan.
          </p>
        </div>
      )}
      {/* if theh user is on a non-free plan and doesn't have an affiliate code in their user data, show a promo for the affiliate program */}
      {/* {planInfo.plan !== 'free' && !planInfo.hasAffiliateCode && (
        <div className="p-3 my-4 text-sm bg-yellow-100 border border-yellow-200 dark:bg-yellow-900 dark:border-yellow-800 rounded-md">
          <p className="text-yellow-700 dark:text-yellow-300">
            Join our affiliate program and earn $5 for all new paid signups.
          </p>
          <Button variant="outline" className="mt-2" asChild>
            <Link href="/dashboard/affiliate-program">Learn More</Link>
          </Button>
        </div>
      )} */}
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">Your Usage</h3>
        <p className="text-sm">Plan: {planName}</p>

        <div className="space-y-1">
          <p className="text-sm">
            Songs: {planInfo.usage.songCount} / {planInfo.limits.songLimit}
          </p>
          <Progress
            value={(planInfo.usage.songCount / planInfo.limits.songLimit) * 100}
            max={100}
            indicatorColor={
              planInfo.isOverLimit.songs
                ? 'bg-red-500'
                : planInfo.usage.songCount === planInfo.limits.songLimit
                  ? 'bg-yellow-500'
                  : 'bg-primary'
            }
          />
        </div>
        {/* quick clips */}

        {/* <div className="space-y-1">
          <p className="text-sm">
            Quick Clips: {planInfo.usage.quickClipCount} /{' '}
            {planInfo.limits.quickClipLimit}
          </p>
          <Progress
            value={
              (planInfo.usage.quickClipCount / planInfo.limits.quickClipLimit) *
              100
            }
            max={100}
            indicatorColor={
              planInfo.isOverLimit.quickClips
                ? 'bg-red-500'
                : planInfo.usage.quickClipCount ===
                    planInfo.limits.quickClipLimit
                  ? 'bg-yellow-500'
                  : 'bg-primary'
            }
          />
        </div> */}
      </div>
    </div>
  );
};

export default memo(UserLimits);
