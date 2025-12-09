import { Sidebar } from './sidebar';
import UserHeader from './UserHeader';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {
  Menu,
  Home,
  Music,
  Speaker,
  CircleUser,
  FileText,
  Mail
} from 'lucide-react';
import Link from 'next/link';
// Dynamically import DashboardUtils for analytics and stuff
const DashboardUtils = dynamic(() => import('./DashboardUtils'), {
  ssr: false
});

const MIXFLIP_APP = 'https://mixflip.producerapps.com';

export default function DesktopLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const NavItems = [
    {
      name: 'Dashboard',
      icon: 'Home',
      href: '/dashboard'
    },
    {
      name: 'Songs',
      icon: 'Music',
      href: '/dashboard/songs'
    },
    {
      name: 'Players',
      icon: 'Speaker',
      href: '/dashboard/players'
    },
    {
      name: 'Landing Pages',
      icon: 'FileText',
      href: '/dashboard/landing-pages'
    },
    {
      name: 'Contact Forms',
      icon: 'Mail',
      href: '/dashboard/contact-forms'
    },
    {
      name: 'Account',
      icon: 'CircleUser',
      href: '/dashboard/account'
    }
  ] as const;
  return (
    <div className="grid h-screen w-full overflow-hidden md:grid-cols-[60px_1fr] lg:grid-cols-[180px_1fr]">
      <Sidebar />
      <div className="flex flex-col min-h-0">
        <header className="sticky top-0 z-40  bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/60">
          <div className="mx-auto w-full border-b max-w-screen-lg md:max-w-screen-xl xl:max-w-screen-2xl flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6">
            <div className="md:hidden">
              <Link
                href="https://mixflip.producerapps.com/dashboard/"
                className="flex items-center gap-2"
              >
                <img src="/favicon.png" alt="MixFlip" width={32} height={32} />
                <span className="text-xl font-bold">MixFlip</span>
              </Link>
            </div>
            <div className="flex flex-row items-center gap-2 justify-between w-full">
              <div className="flex flex-row items-center gap-2 ml-auto">
                <Suspense>
                  <UserHeader />
                </Suspense>
                {/* Mobile Menu */}
                <Sheet>
                  <SheetTrigger
                    className="p-2 border rounded-md md:hidden"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-4 h-4" />
                  </SheetTrigger>
                  <SheetContent className="space-y-10">
                    <div className="flex items-center gap-2">
                      <img
                        src="/favicon.png"
                        alt="MixFlip"
                        width={32}
                        height={32}
                      />
                      <span className="text-xl font-bold">MixFlip</span>
                    </div>
                    <nav className="grid items-start gap-6 text-sm font-medium text-muted-foreground">
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2"
                        >
                          <Home className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href={`${MIXFLIP_APP}/dashboard/songs`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Music className="w-4 h-4" />
                          <span>Songs</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href={`${MIXFLIP_APP}/dashboard/players`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Speaker className="w-4 h-4" />
                          <span>Players</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href={`${MIXFLIP_APP}/dashboard/landing-pages`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Landing Pages</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href={`${MIXFLIP_APP}/dashboard/contact-forms`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Contact Forms</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/dashboard/account"
                          className="flex items-center gap-2"
                        >
                          <CircleUser className="w-4 h-4" />
                          <span>Account</span>
                        </Link>
                      </SheetClose>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-50 dark:bg-neutral-950">
          <div className="mx-auto w-full max-w-screen-lg md:max-w-screen-xl xl:max-w-screen-2xl px-2 py-6 md:px-4 lg:gap-6 lg:p-6">
            {children}
            <Suspense>
              <DashboardUtils />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
