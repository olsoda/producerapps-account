'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect, Suspense } from 'react';
import Script from 'next/script';
import Image from 'next/image';

function ConfirmSignupContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // Get the encoded confirmation URL from the query parameter
  const confirmationUrl = searchParams.get('confirmation_url');

  // Decode the confirmation URL since it will be URL-encoded
  const decodedConfirmationUrl = confirmationUrl
    ? decodeURIComponent(confirmationUrl)
    : null;

  const handleConfirm = async () => {
    if (!decodedConfirmationUrl) {
      setError('Invalid confirmation URL');
      return;
    }

    try {
      setLoading(true);
      const token = new URL(decodedConfirmationUrl).searchParams.get('token');
      if (!token) throw new Error('No confirmation token found');

      // Confirm the user's email
      const { error: confirmError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (confirmError) throw confirmError;

      // Get the user session after confirmation
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Create or retrieve Stripe customer and create trial subscription
        try {
          const response = await fetch('/api/create-stripe-customer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: session.user.email,
              uuid: session.user.id
            })
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error('Error setting up Stripe customer:', data.error);
            // Optionally show error to user
            setError(`Failed to setup account: ${data.error}`);
            // But still continue with confirmation
          }
        } catch (stripeError) {
          console.error('Error setting up Stripe customer:', stripeError);
          // Optionally show error to user
          setError('Failed to setup account. Please contact support.');
          // But still continue with confirmation
        }
      }

      setConfirmed(true);
      // Redirect to dashboard after successful confirmation
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during confirmation'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
      <div className="p-8 bg-card rounded-lg shadow border">
        <div className="flex items-center justify-center gap-2">
          <Image src="/favicon.png" alt="mixflip logo" width={60} height={60} />
          <p className="text-4xl font-extrabold text-foreground">MixFlip</p>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Confirm Your Email
        </h1>

        {error && (
          <div className="px-4 py-3 mb-4 text-destructive-foreground bg-destructive/10 border border-destructive rounded">
            {error}
          </div>
        )}

        {confirmed ? (
          <div className="px-4 py-3 text-success-foreground bg-success/10 border border-success rounded">
            Email confirmed successfully! Redirecting...
          </div>
        ) : (
          <>
            <p className="mb-4 text-muted-foreground">
              Please click the button below to confirm your email address.
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading || !decodedConfirmationUrl}
              className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded hover:bg-primary/90 focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Email'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
      <div className="p-8 bg-card rounded-lg shadow border">
        <div className="flex items-center justify-center gap-2">
          <Image src="/favicon.png" alt="mixflip logo" width={60} height={60} />
          <p className="text-4xl font-extrabold text-foreground">MixFlip</p>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-foreground">Loading...</h1>
      </div>
    </div>
  );
}

// Main component that wraps the content with Suspense
export default function ConfirmSignup() {
  return (
    <>
      <Script
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
      />
      <Suspense fallback={<LoadingState />}>
        <ConfirmSignupContent />
      </Suspense>
    </>
  );
}
