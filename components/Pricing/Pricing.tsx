// pricing.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tables } from '@/types_db';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe, createStripePortal } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Music,
  FileText,
  Zap,
  Crown,
  Building2
} from 'lucide-react';

type Subscription = Tables<'subscriptions'>;
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
}

type BillingInterval = 'lifetime' | 'year' | 'month';

interface Promotion {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  appliesToMonthly: boolean;
  appliesToYearly: boolean;
  active: boolean;
}

interface PromotionResponse {
  promotion: Promotion | null;
}

async function fetchActivePromotion(): Promise<PromotionResponse> {
  const response = await fetch('/api/active-promotion', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch promotion');
  }

  return response.json();
}

// Helper to determine plan tier for comparison
function getPlanTier(productName: string): number {
  const name = productName.toLowerCase();
  if (name.includes('enterprise 200') || name.includes('enterprise200'))
    return 6;
  if (name.includes('enterprise 150') || name.includes('enterprise150'))
    return 5;
  if (
    name.includes('enterprise 100') ||
    name.includes('enterprise100') ||
    name.includes('enterprise')
  )
    return 4;
  if (name.includes('pro')) return 3;
  if (name.includes('standard')) return 2;
  if (name.includes('starter')) return 1;
  return 0; // free
}

// Check if a plan is a potential upgrade
function isPotentialUpgrade(
  product: ProductWithPrices,
  price: Price,
  subscription: SubscriptionWithProduct | null,
  currentBillingInterval: BillingInterval
): boolean {
  if (!subscription) {
    // No subscription means free plan, so any paid plan is an upgrade
    return !!(price.unit_amount && price.unit_amount > 0);
  }

  const currentProductName = subscription?.prices?.products?.name || '';
  const currentProductTier = getPlanTier(currentProductName);
  const newProductTier = getPlanTier(product.name);
  const currentInterval =
    (subscription?.prices?.interval as BillingInterval) || 'month';
  const newInterval = (price.interval as BillingInterval) || 'month';

  // Same product and same interval = not an upgrade
  if (currentProductName === product.name && currentInterval === newInterval) {
    return false;
  }

  // Higher tier = upgrade
  if (newProductTier > currentProductTier) {
    return true;
  }

  // Same tier but switching to yearly from monthly = upgrade (better value)
  if (
    newProductTier === currentProductTier &&
    currentInterval === 'month' &&
    newInterval === 'year'
  ) {
    return true;
  }

  // Lower tier or same tier with worse interval = not an upgrade
  return false;
}

export default function Pricing({ user, products, subscription }: Props) {
  const intervals = Array.from(
    new Set(
      products.flatMap((product) =>
        product?.prices?.map((price) => price?.interval)
      )
    )
  );
  const router = useRouter();
  const currentPath = usePathname();

  // Detect user's current plan and billing interval
  const getCurrentPlanInfo = () => {
    if (!subscription) {
      return { planType: 'free', billingInterval: 'month' as BillingInterval };
    }

    const productName = subscription?.prices?.products?.name || '';
    const currentBillingInterval =
      (subscription?.prices?.interval as BillingInterval) || 'month';

    let planType = 'standard';
    if (productName.toLowerCase().includes('free')) planType = 'free';
    else if (productName.toLowerCase().includes('pro')) planType = 'pro';
    else if (productName.toLowerCase().includes('enterprise'))
      planType = 'enterprise';

    return { planType, billingInterval: currentBillingInterval };
  };

  const currentPlanInfo = getCurrentPlanInfo();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    currentPlanInfo.billingInterval
  );
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [showEnterprise, setShowEnterprise] = useState(
    currentPlanInfo.planType === 'enterprise'
  );
  const [isEnterpriseMode, setIsEnterpriseMode] = useState(
    currentPlanInfo.planType === 'enterprise'
  );

  // Fetch active promotion
  const { data: promotionData } = useQuery<PromotionResponse>({
    queryKey: ['activePromotion'],
    queryFn: fetchActivePromotion,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  const promotion = promotionData?.promotion;

  // Filter products to hide the Starter plan unless it's the user's current plan
  const filteredProducts = products.filter((product) => {
    // Check if this is the Starter plan product
    const isStarterPlan = product.id === 'prod_QmHGv85UojlJtk';

    // If it's the Starter plan, only show it if it's the user's current plan
    if (isStarterPlan) {
      return (
        subscription &&
        subscription.prices?.products?.id === 'prod_QmHGv85UojlJtk'
      );
    }

    // Show all other plans
    return true;
  });

  // Separate enterprise plans from regular plans
  const regularProducts = filteredProducts.filter(
    (product) => !product.name.toLowerCase().includes('enterprise')
  );
  const enterpriseProducts = filteredProducts.filter((product) =>
    product.name.toLowerCase().includes('enterprise')
  );

  const handleSubscriptionAction = async (
    price: Price,
    product?: ProductWithPrices
  ) => {
    setPriceIdLoading(price.id);

    if (subscription) {
      setPriceIdLoading(undefined);
      await handleStripePortalRequest();
    } else {
      if (!user) {
        setPriceIdLoading(undefined);
        return router.push('/signin/signup');
      }

      // Find the product if not provided
      const productForPrice =
        product ||
        products.find((p) => p.prices?.some((p) => p.id === price.id));

      // Check if this is a potential upgrade and get promotion code
      let promotionCode: string | undefined;
      if (productForPrice && promotion?.active) {
        const isUpgrade = isPotentialUpgrade(
          productForPrice,
          price,
          subscription,
          currentPlanInfo.billingInterval
        );

        // Also check if promotion applies to this billing interval
        const priceInterval = (price.interval as BillingInterval) || 'month';
        const appliesToInterval =
          (priceInterval === 'month' && promotion.appliesToMonthly) ||
          (priceInterval === 'year' && promotion.appliesToYearly);

        promotionCode =
          isUpgrade && appliesToInterval ? promotion.code : undefined;
      }

      const { errorRedirect, sessionId } = await checkoutWithStripe(
        price,
        currentPath,
        promotionCode
      );

      if (errorRedirect) {
        setPriceIdLoading(undefined);
        return router.push(errorRedirect);
      }

      if (!sessionId) {
        setPriceIdLoading(undefined);
        return router.push(
          getErrorRedirect(
            currentPath,
            'An unknown error occurred.',
            'Please try again later or contact a system administrator.'
          )
        );
      }

      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });

      setPriceIdLoading(undefined);
    }
  };

  const handleStripePortalRequest = async () => {
    setPriceIdLoading(undefined);
    const redirectUrl = await createStripePortal(currentPath);
    return router.push(redirectUrl);
  };

  if (!products.length) {
    return (
      <section>
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-4xl font-extrabold text-foreground sm:text-center sm:text-6xl">
            No subscription pricing plans found. Create them in your{' '}
            <a
              className="text-primary underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
      </section>
    );
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('free')) return Music;
    if (planName.toLowerCase().includes('standard')) return FileText;
    if (planName.toLowerCase().includes('pro')) return Crown;
    if (planName.toLowerCase().includes('enterprise')) return Building2;
    return Zap;
  };

  const getPlanColor = (planName: string, isCurrent: boolean) => {
    if (isCurrent)
      return 'border-primary shadow-md shadow-primary/20 bg-primary/5';
    if (planName.toLowerCase().includes('free')) return 'border-muted';
    if (planName.toLowerCase().includes('standard'))
      return 'border-blue-200 dark:border-blue-800';
    if (planName.toLowerCase().includes('pro'))
      return 'border-purple-200 dark:border-purple-800';
    if (planName.toLowerCase().includes('enterprise'))
      return 'border-orange-200 dark:border-orange-800';
    return 'border-muted';
  };

  // Calculate discounted price
  const getDiscountedPrice = (
    price: Price
  ): { original: string; discounted: string; savings: string } | null => {
    if (!promotion || !promotion.active || !price.unit_amount) return null;

    const interval = (price.interval as BillingInterval) || 'month';
    const appliesToInterval =
      (interval === 'month' && promotion.appliesToMonthly) ||
      (interval === 'year' && promotion.appliesToYearly);

    if (!appliesToInterval) return null;

    const originalAmount = price.unit_amount / 100;
    let discountedAmount = originalAmount;

    if (promotion.discountType === 'percentage') {
      discountedAmount = originalAmount * (1 - promotion.discount / 100);
    } else {
      discountedAmount = Math.max(0, originalAmount - promotion.discount);
    }

    const currency = price.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    });

    const original = formatter.format(originalAmount);
    const discounted = formatter.format(discountedAmount);
    const savings = formatter.format(originalAmount - discountedAmount);

    return { original, discounted, savings };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Start with our free plan and upgrade as you grow. All plans include
          unlimited embeds and zero audio encoding.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span
              className={cn(
                'text-sm font-medium',
                billingInterval === 'month'
                  ? 'text-foreground'
                  : 'text-muted-foreground',
                isEnterpriseMode && 'text-muted-foreground'
              )}
            >
              Monthly
            </span>
            <Switch
              checked={billingInterval === 'year'}
              onCheckedChange={(checked) =>
                setBillingInterval(checked ? 'year' : 'month')
              }
              disabled={isEnterpriseMode}
            />
            <span
              className={cn(
                'text-sm font-medium',
                billingInterval === 'year'
                  ? 'text-foreground'
                  : 'text-muted-foreground',
                isEnterpriseMode && 'text-foreground'
              )}
            >
              Yearly
            </span>

            {subscription && (
              <Badge variant="outline" className="ml-2">
                Your billing:{' '}
                {currentPlanInfo.billingInterval === 'year'
                  ? 'Yearly'
                  : 'Monthly'}
              </Badge>
            )}
          </div>

          {/* Enterprise Toggle */}
          {enterpriseProducts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newShowEnterprise = !showEnterprise;
                setShowEnterprise(newShowEnterprise);
                setIsEnterpriseMode(newShowEnterprise);
                if (newShowEnterprise && billingInterval === 'month') {
                  setBillingInterval('year');
                }
                if (!newShowEnterprise) {
                  // Reset to monthly when going back to standard plans
                  setBillingInterval('month');
                }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {showEnterprise ? 'Show Standard Plans' : 'Show Enterprise Plans'}
            </Button>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!showEnterprise ? (
          <>
            {/* Free Plan */}
            <Card
              className={cn(
                'relative',
                getPlanColor('MixFlip Free', !subscription)
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Music className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">MixFlip Free</CardTitle>
                  </div>
                  {!subscription && <Badge variant="default">Your Plan</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>5 songs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>MP3 uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>1 landing page</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Basic player and landing page analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>MixFlip branding on players</span>
                  </li>
                </ul>

                <Button
                  className="w-full"
                  disabled={!user || !subscription}
                  onClick={() => (!user ? router.push('/signin/signup') : null)}
                >
                  {!user
                    ? 'Sign Up'
                    : !subscription
                      ? 'Current Plan'
                      : 'Manage Subscription On Stripe'}
                </Button>
              </CardContent>
            </Card>

            {/* Regular Paid Plans */}
            {regularProducts.map((product) => {
              const price = product?.prices?.find(
                (price) => price.interval === billingInterval
              );
              if (!price) return null;

              const priceString = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: price.currency!,
                minimumFractionDigits: 2
              }).format((price?.unit_amount || 0) / 100);

              const isCurrentPlan =
                subscription &&
                product.name === subscription?.prices?.products?.name;
              const Icon = getPlanIcon(product.name);

              // Check if this is a potential upgrade and has discount
              const isUpgrade = isPotentialUpgrade(
                product,
                price,
                subscription,
                currentPlanInfo.billingInterval
              );
              const discountInfo = isUpgrade ? getDiscountedPrice(price) : null;

              return (
                <Card
                  key={product.id}
                  className={cn(
                    'relative',
                    getPlanColor(product.name, !!isCurrentPlan)
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">
                          {product.name}
                        </CardTitle>
                      </div>
                      {isCurrentPlan && (
                        <Badge variant="default">Your Plan</Badge>
                      )}
                      {subscription &&
                        subscription.status === 'trialing' &&
                        isCurrentPlan && (
                          <Badge variant="outline" className="ml-2">
                            Trial
                          </Badge>
                        )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        {discountInfo ? (
                          <>
                            <span className="text-3xl font-bold">
                              {discountInfo.discounted}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              {discountInfo.original}
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-bold">
                            {priceString}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          /{billingInterval}
                        </span>
                      </div>
                      {discountInfo && promotion && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            Save {discountInfo.savings}
                          </Badge>
                          <span className="text-muted-foreground">
                            Use code:{' '}
                            <span className="font-semibold">
                              {promotion.code}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{product.song_limit} songs</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>
                          {product.name === 'MixFlip Standard' ||
                          product.name === 'MixFlip Pro' ||
                          product.name.toLowerCase().includes('enterprise')
                            ? 'MP3, FLAC, WAV uploads'
                            : 'MP3 uploads'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>
                          {product.name === 'MixFlip Pro' && '10 landing pages'}
                          {product.name === 'MixFlip Standard' &&
                            '5 landing pages'}
                          {!product.name.includes('Pro') &&
                            !product.name.includes('Standard') &&
                            '1 landing page'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>
                          {product.name === 'MixFlip Pro'
                            ? 'Advanced player and landing page analytics'
                            : 'Basic player and landing page analytics'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>
                          {product.require_branding !== false
                            ? 'MixFlip branding on players'
                            : 'No branding on players'}
                        </span>
                      </li>
                    </ul>

                    <Button
                      className="w-full"
                      disabled={priceIdLoading === price.id}
                      onClick={() => handleSubscriptionAction(price, product)}
                    >
                      {priceIdLoading === price.id
                        ? 'Processing...'
                        : subscription
                          ? 'Manage Subscription On Stripe'
                          : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </>
        ) : /* Enterprise Plans */
        enterpriseProducts.length > 0 ? (
          enterpriseProducts.map((product) => {
            const price = product?.prices?.find(
              (price) => price.interval === billingInterval
            );
            if (!price) return null;

            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency!,
              minimumFractionDigits: 2
            }).format((price?.unit_amount || 0) / 100);

            const isCurrentPlan =
              subscription &&
              product.name === subscription?.prices?.products?.name;
            const Icon = getPlanIcon(product.name);

            // Check if this is a potential upgrade and has discount
            const isUpgrade = isPotentialUpgrade(
              product,
              price,
              subscription,
              currentPlanInfo.billingInterval
            );
            const discountInfo = isUpgrade ? getDiscountedPrice(price) : null;

            return (
              <Card
                key={product.id}
                className={cn(
                  'relative',
                  getPlanColor(product.name, !!isCurrentPlan)
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    {isCurrentPlan && (
                      <Badge variant="secondary">Your Plan</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      {discountInfo ? (
                        <>
                          <span className="text-3xl font-bold">
                            {discountInfo.discounted}
                          </span>
                          <span className="text-lg text-muted-foreground line-through">
                            {discountInfo.original}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold">
                          {priceString}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        /{billingInterval}
                      </span>
                    </div>
                    {discountInfo && promotion && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          Save {discountInfo.savings}
                        </Badge>
                        <span className="text-muted-foreground">
                          Use code:{' '}
                          <span className="font-semibold">
                            {promotion.code}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{product.song_limit} songs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>MP3, FLAC, WAV uploads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>
                        {product.name === 'MixFlip Enterprise 100' &&
                          '100 landing pages'}
                        {product.name === 'MixFlip Enterprise 150' &&
                          '150 landing pages'}
                        {product.name === 'MixFlip Enterprise 200' &&
                          '200 landing pages'}
                        {!product.name.includes('Enterprise') &&
                          'Unlimited landing pages'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Advanced player and landing page analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>No branding on players</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full"
                    disabled={priceIdLoading === price.id}
                    onClick={() => handleSubscriptionAction(price, product)}
                  >
                    {priceIdLoading === price.id
                      ? 'Processing...'
                      : subscription
                        ? 'Manage Subscription On Stripe'
                        : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              {billingInterval === 'month'
                ? 'Enterprise plans are only available with yearly billing. Switch to yearly to view enterprise options.'
                : 'No enterprise plans available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
