import { Metadata } from 'next';
import Footer from '@/components/template_ui/Footer';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import Image from 'next/image';
import Script from 'next/script';
import ChatwootWidget from '@/components/ChatwootWidget';
import { createClient } from '@/utils/supabase/server';
import { Inter } from 'next/font/google';
import QueryProvider from '@/providers/QueryProvider';

// import Pixel from '@/components/pixel';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const meta = {
  title: 'ProducerApps Account',
  description:
    'Manage your ProducerApps account, billing, and profile. Launch MixFlip from the account portal.',
  robots: 'follow, index',
  favicon: '/favicon.png',
  url: getURL(),
  image: '/og.png'
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: meta.title,
    description: meta.description,
    referrer: 'origin-when-cross-origin',
    keywords: ['ProducerApps', 'Account', 'Billing', 'Subscriptions'],
    authors: [{ name: 'ProducerApps', url: 'https://producerapps.com/' }],
    creator: 'ProducerApps',
    publisher: 'ProducerApps',
    robots: meta.robots,
    icons: {
      icon: [{ url: '/favicon.ico' }, { url: '/favicon.png' }],
      apple: [{ url: '/apple-touch-icon.png' }]
    },
    metadataBase: new URL(meta.url),
    openGraph: {
      url: meta.url,
      title: meta.title,
      description: meta.description,
      type: 'website',
      siteName: meta.title,
      images: [
        {
          url: meta.image,
          width: 1200,
          height: 630,
          alt: meta.title
        }
      ]
    }
  };
}

export default async function RootLayout({ children }: PropsWithChildren<{}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* <script src="https://unpkg.com/react-scan/dist/auto.global.js"></script> */}
        <link rel="icon" href="/favicon.png" sizes="any" />
        <Script
          strategy="lazyOnload"
          data-domain="account.producerapps.com"
          src="https://analytics.evergreenrecords.com/js/script.js"
        />
      </head>
      <body className={inter.className}>
        <main id="" className="">

            <QueryProvider>{children}</QueryProvider>
        </main>
        {/* <Pixel /> */}
      </body>
    </html>
  );
}
