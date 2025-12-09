'use client';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { createStripePortal } from '@/utils/stripe/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tables } from '@/types_db';
import Pricing from '@/components/Pricing/Pricing';
import Link from 'next/link';

type Subscription = Tables<'subscriptions'>;
type Price = Tables<'prices'>;
type Product = Tables<'products'>;
type SubscriptionWithPriceAndProduct = Subscription & {
  prices: (Price & { products: Product | null }) | null;
};

interface Props {
  subscription: SubscriptionWithPriceAndProduct | null;
  products: (Product & { prices: Price[] })[];
  user: any; // Update this with the appropriate type for the user object
  planStatus: string | null | undefined;
  trialEndDate: string | null | undefined;
}

export default function CustomerPortalForm({
  subscription,
  products,
  user,
  planStatus,
  trialEndDate
}: Props) {
  const router = useRouter();
  const currentPath = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscriptionPrice =
    subscription &&
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.prices?.currency!,
      minimumFractionDigits: 0
    }).format((subscription?.prices?.unit_amount || 0) / 100);

  const getBillingIntervalText = (interval: string | null | undefined) => {
    switch (interval) {
      case 'year':
        return 'yearly';
      case 'month':
        return 'monthly';
      default:
        return 'monthly';
    }
  };

  const getPlanTypeText = (productName: string | null) => {
    if (!productName) return 'Free';
    if (productName.toLowerCase().includes('enterprise')) return 'Enterprise';
    if (productName.toLowerCase().includes('pro')) return 'Pro';
    if (productName.toLowerCase().includes('standard')) return 'Standard';
    if (productName.toLowerCase().includes('starter')) return 'Starter';
    return 'Free';
  };

  const handleStripePortalRequest = async () => {
    setIsSubmitting(true);
    const redirectUrl = await createStripePortal(currentPath);
    setIsSubmitting(false);
    return router.push(redirectUrl);
  };

  // Determine if the user is on the free plan (no subscription)
  const isFreePlan = !subscription;

  return (
    <Card className="flex flex-col justify-between w-full h-full">
      <div>
        <CardHeader>
          <CardTitle className="text-xl">Your Subscription</CardTitle>
        </CardHeader>
        <CardContent className="">
          {subscription ? (
            <div>
              {planStatus === 'trialing' ? (
                <div className="">
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        You are currently on the{' '}
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {subscription?.prices?.products?.name}
                      </span>{' '}
                      <span className="text-muted-foreground">plan in</span>{' '}
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        Trial Mode
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        (
                        {getBillingIntervalText(
                          subscription?.prices?.interval
                        )}{' '}
                        billing)
                      </span>
                      .
                    </p>
                  </div>
                  <p className="mb-4 text-muted-foreground text-sm">
                    Your trial ends on{' '}
                    <span className="font-semibold text-foreground">
                      {new Date(trialEndDate!).toLocaleDateString()}
                    </span>
                    . If you want to continue using MixFlip after that, make
                    sure to add a payment method in the Stripe Billing Portal.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        You are currently on the{' '}
                      </span>
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {subscription?.prices?.products?.name}
                      </span>{' '}
                      <span className="text-muted-foreground">plan</span>
                      <span className="text-muted-foreground">
                        {' '}
                        (
                        {getBillingIntervalText(
                          subscription?.prices?.interval
                        )}{' '}
                        billing)
                      </span>
                      {subscriptionPrice && (
                        <span className="text-muted-foreground">
                          {' '}
                          - {subscriptionPrice}/{subscription?.prices?.interval}
                        </span>
                      )}
                      .
                    </p>
                  </div>
                  <p className="mb-4 text-muted-foreground text-sm">
                    Your subscription will renew automatically on{' '}
                    <span className="font-semibold text-foreground">
                      {new Date(
                        subscription?.current_period_end
                      ).toLocaleDateString()}
                    </span>
                    .
                  </p>
                </>
              )}
              <p className="mb-4 text-muted-foreground text-sm">
                Update your billing info, switch plans, or see your upcoming
                bill in the Stripe Billing Portal.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    You are currently on the{' '}
                  </span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    MixFlip Free
                  </span>{' '}
                  <span className="text-muted-foreground">
                    plan (no billing required)
                  </span>
                  .
                </p>
              </div>
              <p className="mb-4 text-muted-foreground text-sm">
                Upgrade to a paid plan to access more features and higher
                limits.
              </p>
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="flex justify-end align-middle">
        <Button
          onClick={handleStripePortalRequest}
          disabled={isSubmitting || !subscription}
        >
          Manage Subscription on Stripe
        </Button>
      </CardFooter>
    </Card>
  );
}
