// app/reset-password/page.tsx
'use client';
import Image from 'next/image';
import PasswordResetForm from '@/components/PasswordResetForm';
import { Toaster } from '@/components/template_ui/TemplateToasts/toaster';
import { Suspense } from 'react';

export default function ResetPassword() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col justify-center w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Image src="/favicon.png" alt="mixflip logo" width={72} height={72} />{' '}
          <p className="text-6xl font-extrabold">MixFlip</p>
        </div>
        <PasswordResetForm />
      </div>
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
