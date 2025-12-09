'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

const STORAGE_KEY_PREFIX = 'promo_banner_dismissed_';

async function fetchActivePromotion(): Promise<PromotionResponse> {
  const response = await fetch('/api/active-promotion', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch promotion');
  }

  return response.json();
}

interface PromotionBannerProps {
  variant?: 'header' | 'sidebar';
  className?: string;
}

export default function PromotionBanner({ variant = 'header', className }: PromotionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start as dismissed to avoid flash
  const [isVisible, setIsVisible] = useState(false);

  const { data, isLoading, error } = useQuery<PromotionResponse>({
    queryKey: ['activePromotion'],
    queryFn: fetchActivePromotion,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1
  });

  const promotion = data?.promotion ?? null;

  // Check if promotion is dismissed on mount and when promotion changes
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return;
    }

    if (!promotion || !promotion.active) {
      setIsDismissed(true);
      setIsVisible(false);
      return;
    }

    // Check localStorage for dismissal
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${promotion.code}`;
      const dismissed = localStorage.getItem(storageKey) === 'true';

      setIsDismissed(dismissed);

      // Only show if not dismissed and promotion is active
      if (!dismissed && promotion.active) {
        // Small delay to avoid flash
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      // If localStorage is not available, don't show the banner
      console.warn('localStorage not available:', error);
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, [promotion]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!promotion || typeof window === 'undefined') return;

    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${promotion.code}`;
      localStorage.setItem(storageKey, 'true');
      setIsDismissed(true);
      setIsVisible(false);
    } catch (error) {
      console.warn('Failed to save dismissal to localStorage:', error);
      // Still dismiss even if localStorage fails
      setIsDismissed(true);
      setIsVisible(false);
    }
  };

  // Don't render if loading, error, no promotion, not active, or dismissed
  if (
    isLoading ||
    error ||
    !promotion ||
    !promotion.active ||
    isDismissed ||
    !isVisible
  ) {
    return null;
  }

  // Format the discount message
  const discountText =
    promotion.discountType === 'percentage'
      ? `${promotion.discount}% off`
      : `$${promotion.discount} off`;

  // Determine what the promotion applies to
  const appliesTo = [];
  if (promotion.appliesToMonthly) appliesTo.push('monthly');
  if (promotion.appliesToYearly) appliesTo.push('yearly');

  const appliesToText =
    appliesTo.length === 2
      ? 'monthly and yearly plan'
      : appliesTo.length === 1
        ? `${appliesTo[0]} plan`
        : 'plan';

  // Format end date
  const endDate = new Date(promotion.endDate);
  const endDateText = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isSidebar = variant === 'sidebar';

  return (
    <div
      className={cn(
        'bg-primary/10 rounded-lg transition-opacity relative',
        isSidebar 
          ? 'px-3 py-2' 
          : 'px-4 py-1 rounded-full flex items-center',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
    >
      <Link
        href="/dashboard/account"
        role="banner"
        aria-label="Active promotion"
        className={cn(
          'flex gap-2',
          isSidebar ? 'flex-col items-start pr-6' : 'flex-row items-center'
        )}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tag className="h-4 w-4 text-primary flex-shrink-0" />
          {!isSidebar && (
            <p className="text-sm text-primary font-medium whitespace-nowrap">
              <span className="font-semibold">{promotion.name}</span>
              {' - '}
              {discountText} on {appliesToText} upgrades
              {promotion.endDate && ` until ${endDateText}`} with code{' '}
              <span className="font-semibold">{promotion.code}</span>
            </p>
          )}
        </div>
        {isSidebar && (
          <div className="flex flex-col gap-0.5 text-xs text-primary w-full">
            <p className="font-semibold leading-tight">{promotion.name}</p>
            <p className="text-primary/90 leading-tight break-words">
              {discountText} on {appliesToText} upgrades
              {promotion.endDate && ` until ${endDateText}`}
            </p>
            <p className="text-primary/90 leading-tight">
              Code: <span className="font-semibold">{promotion.code}</span>
            </p>
          </div>
        )}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6 flex-shrink-0 text-primary hover:text-primary/80 hover:bg-primary/10',
          isSidebar ? 'absolute top-1.5 right-1.5' : 'ml-2 h-7 w-7'
        )}
        onClick={handleDismiss}
        aria-label="Dismiss promotion banner"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
