'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { handleRequest } from '@/utils/auth-helpers/client';
import { signInWithPassword } from '@/utils/auth-helpers/server';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/template_ui/TemplateToasts/toaster';
import { Suspense } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { signInWithOAuth } from '@/utils/auth-helpers/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

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

  const handleGoogleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await signInWithOAuth(e);
    setIsSubmitting(false);
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
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

    try {
      await handleRequest(e, signInWithPassword, router);
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      toast({
        title: 'Sign-in Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Marketing / Benefits panel */}
      <div className="hidden md:flex flex-col justify-center bg-muted p-10">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Image
              src="/favicon.png"
              alt="MixFlip logo"
              width={48}
              height={48}
            />
            <p className="text-2xl font-extrabold">MixFlip</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to manage your players, songs, and landing pages.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{' '}
              Real-time player analytics
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{' '}
              Unlimited embeds on any site
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{' '}
              Fast, distraction-free audio
            </li>
          </ul>
        </div>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2 mb-2">
              <Image
                src="/favicon.png"
                alt="MixFlip logo"
                width={32}
                height={32}
              />
              Sign in
            </CardTitle>
            <CardDescription>Access your MixFlip dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <input
                type="hidden"
                name="turnstileToken"
                value={turnstileToken}
              />
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setTurnstileToken(token)}
                options={{ size: 'invisible' }}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                Sign in
              </Button>
            </form>

            {/* <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  or continue with
                </span>
              </div>
            </div> */}

            {/* <form onSubmit={handleGoogleSignIn} key="google">
              <input type="hidden" name="provider" value="google" />
              <Button
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>
            </form> */}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-primary">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
        <Suspense>
          <Toaster />
        </Suspense>
      </div>
    </div>
  );
}
