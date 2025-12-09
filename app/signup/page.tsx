// app/signup/page.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleRequest } from '@/utils/auth-helpers/client';
import { signUp } from '@/utils/auth-helpers/server';
import { Toaster } from '@/components/template_ui/TemplateToasts/toaster';
import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Turnstile } from '@marsidev/react-turnstile';
import { getCookie } from '@/lib/utils';
import Script from 'next/script';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import classNames from 'classnames';

function SignUpContent() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();

  useEffect(() => {
    // Check URL parameter first (takes precedence)
    const promoParam = searchParams.get('promo');

    if (promoParam) {
      setAffiliateCode(promoParam);
      // Only set referral code if user hasn't entered one yet
      if (!referralCode) {
        setReferralCode(promoParam);
      }
      return;
    }

    // Fall back to cookie if no URL parameter
    const affiliateCodeCookie = getCookie('mixflip_affiliate_ref');

    if (affiliateCodeCookie) {
      try {
        const parsedCode = JSON.parse(affiliateCodeCookie);
        if (parsedCode.code) {
          setAffiliateCode(parsedCode.code);
          // Only set referral code if user hasn't entered one yet
          if (!referralCode) {
            setReferralCode(parsedCode.code);
          }
        }
      } catch (error) {
        // If parsing fails, use the cookie value as-is
        setAffiliateCode(affiliateCodeCookie);
        if (!referralCode) {
          setReferralCode(affiliateCodeCookie);
        }
      }
    }
  }, [referralCode, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!turnstileToken) {
      toast({
        title: 'CAPTCHA Error',
        description: 'Please complete the CAPTCHA challenge.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('confirmEmail', confirmEmail);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append('referralCode', referralCode);
    formData.append('turnstileToken', turnstileToken);

    try {
      const result = await signUp(formData);
      if (typeof result === 'string' && result.startsWith('/')) {
        router.push(result);
      } else {
        toast({
          title: 'Sign-up Error',
          description: result as string,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      toast({
        title: 'Sign-up Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        // User is already logged in, redirect to the dashboard
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, []);

  return (
    <>
      {/* <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=AW-737834201"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-737834201');
          `
        }}
      /> */}
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-muted">
        {/* Marketing / Benefits panel - Desktop */}
        <div className="hidden md:flex flex-col justify-center bg-muted p-10">
          <div className="max-w-md mx-auto space-y-6">
            <Image
              src="https://r2.mixflip.io/websiteassets/landingpagedemos/landingpagemockupwithmuso.png"
              alt="MixFlip landing page mockup"
              width={800}
              height={800}
              className="h-56 w-auto"
            />

            <div className="items-center justify-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Create your MixFlip account
              </h2>
              <p className="text-muted-foreground mt-2">
                Start building players and pages in minutes.
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{' '}
                Free plan to get started
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{' '}
                Import songs and embed anywhere
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{' '}
                Upgrade only when you're ready
              </li>
            </ul>
            {affiliateCode && (
              <div className="p-3 text-sm border border-green-600/40 bg-green-500/10 rounded-md text-green-600">
                Referred code{' '}
                <span className="font-semibold">{affiliateCode}</span> applied
              </div>
            )}
          </div>
        </div>

        {/* Form card */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-6 md:bg-white">
          {/* Mobile Marketing Content - Compact version above form */}
          <div className="md:hidden w-full max-w-xl mb-6 space-y-4">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Image
                  src="https://r2.mixflip.io/websiteassets/landingpagedemos/landingpagemockupwithmuso.png"
                  alt="MixFlip landing page mockup"
                  width={400}
                  height={400}
                  className="h-32 w-auto object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Create your MixFlip account
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Start building players and pages in minutes.
                </p>
              </div>
            </div>

            {affiliateCode && (
              <div className="p-2.5 text-xs sm:text-sm border border-green-600/40 bg-green-500/10 rounded-md text-green-600 text-center">
                Referred code{' '}
                <span className="font-semibold">{affiliateCode}</span> applied
              </div>
            )}
          </div>

          <Card className="w-full max-w-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl sm:text-2xl flex items-center justify-center gap-2 mb-2">
                <Image
                  src="/favicon.png"
                  alt="MixFlip logo"
                  width={32}
                  height={32}
                />
                Sign up
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Join MixFlip free. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    name="firstName"
                    className="text-base"
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    name="lastName"
                    className="text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    name="email"
                    className="text-base"
                  />
                  <Input
                    type="email"
                    placeholder="Confirm email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    required
                    name="confirmEmail"
                    className="text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    name="password"
                    className="text-base"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    name="confirmPassword"
                    className="text-base"
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Referral code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  name="referralCode"
                  className="text-base"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" required className="mt-0.5" />
                    <label
                      htmlFor="terms"
                      className="text-xs sm:text-sm text-muted-foreground leading-tight"
                    >
                      I agree to the{' '}
                      <a
                        href="https://mixflip.io/terms"
                        className="text-primary underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Terms of Service
                      </a>
                    </label>
                  </div>
                  <Turnstile
                    siteKey={
                      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!
                    }
                    onSuccess={(token) => setTurnstileToken(token)}
                    options={{ size: 'invisible' }}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-base py-6 sm:py-2"
                >
                  Create account
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
          <Suspense>
            <Toaster />
          </Suspense>
        </div>
      </div>
    </>
  );
}

// Loading fallback component
function LoadingState() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center bg-muted p-10">
        <div className="max-w-md mx-auto space-y-6">
          <div className="h-56 w-auto bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-6">
        <div className="md:hidden w-full max-w-xl mb-6 space-y-4">
          <div className="h-32 w-full bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-6 bg-muted animate-pulse rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2 mx-auto" />
          </div>
        </div>
        <div className="w-full max-w-xl space-y-4">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the content with Suspense
export default function SignUp() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SignUpContent />
    </Suspense>
  );
}
