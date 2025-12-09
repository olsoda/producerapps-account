// app/login/page.tsx

import Image from 'next/image';
import { Toaster } from '@/components/template_ui/TemplateToasts/toaster';
import { Suspense } from 'react';
import Script from 'next/script';

export default function SignupSuccessPage() {
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
          `,
        }}
      />
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col justify-center w-full max-w-md p-8 mx-auto space-y-6 bg-card rounded-lg shadow-lg border">
          <div className="flex items-center justify-center gap-3">
            <Image src="/favicon.png" alt="MixFlip logo" width={60} height={60} />
            <p className="text-4xl font-bold text-foreground">MixFlip</p>
          </div>
          <h1 className="text-2xl font-bold text-center text-foreground">
            Success! Check Your Email to Activate Your Account!
          </h1>
          <p className="text-center text-muted-foreground">
            We have sent you a confirmation email. Please check your inbox and
            click the verification link to activate your account.
          </p>
        </div>
        <Suspense>
          <Toaster />
        </Suspense>
      </div>
    </>
  );
}
