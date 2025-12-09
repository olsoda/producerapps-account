'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { handleRequest } from '@/utils/auth-helpers/client';
import { requestPasswordUpdate } from '@/utils/auth-helpers/server';
import Link from 'next/link';
import { Toaster } from '@/components/template_ui/TemplateToasts/toaster';
import { Suspense } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from '@/components/ui/use-toast';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

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

    const formData = new FormData(e.currentTarget);
    formData.append('turnstileToken', turnstileToken);

    await handleRequest(e, requestPasswordUpdate, router);
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen sm:bg-muted">
      <div className="flex flex-col justify-center w-full max-w-md p-8 mx-auto space-y-8 bg-card sm:rounded-lg sm:shadow-md border">
        <div className="flex items-center justify-center gap-2">
          <Image src="/favicon.png" alt="mixflip logo" width={60} height={60} />{' '}
          <p className="text-4xl font-bold text-foreground">MixFlip</p>
        </div>
        <h1 className="text-2xl font-bold text-center text-foreground">
          Forgot Password
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            name="email"
            className=""
          />
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            options={{ size: 'invisible' }}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            Send Password Reset Link
          </Button>
        </form>
        <div className="flex flex-col items-center space-y-2">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Take me back to the login page
          </Link>
        </div>
      </div>
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
