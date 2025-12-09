// sidebar.tsx
'use client';
import Link from 'next/link';
import { Home, Music, Speaker, CircleUser, FileText, Mail } from 'lucide-react';
import { Suspense, useMemo, memo } from 'react';
import UserLimits from '@/components/UserLimits';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import PromotionBanner to avoid SSR issues with localStorage
const PromotionBanner = dynamic(() => import('@/components/PromotionBanner'), {
  ssr: false
});

const MIXFLIP_APP = 'https://mixflip.producerapps.com';

// Memoized NavLink component
const NavLink = memo(
  ({
    href,
    isSelected,
    icon: Icon,
    label
  }: {
    href: string;
    isSelected: boolean;
    icon: any;
    label: string;
  }) => {
    const baseClasses =
      'flex items-center gap-3 px-3 py-3 transition-all rounded-lg';
    const className = `${baseClasses} ${
      isSelected
        ? 'bg-primary/10 text-primary'
        : 'hover:text-primary text-muted-foreground'
    }`;

    return (
      <Link
        className={className}
        href={href}
        aria-current={isSelected ? 'page' : undefined}
        aria-label={label}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden lg:block text-[13px]">{label}</span>
      </Link>
    );
  }
);
NavLink.displayName = 'NavLink';

// Section header component
const SectionHeader = memo(({ title }: { title: string }) => (
  <div className="hidden lg:block px-3 py-2">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {title}
    </h3>
  </div>
));
SectionHeader.displayName = 'SectionHeader';

export function Sidebar() {
  const pathname = usePathname();

  const selectedItem = useMemo(() => {
    if (pathname.startsWith('/dashboard/account')) return 'account';
    if (pathname.startsWith('/dashboard/players')) return 'players';
    if (pathname.startsWith('/dashboard/songs')) return 'songs';
    if (pathname.startsWith('/dashboard/landing-pages')) return 'landing-pages';
    if (pathname.startsWith('/dashboard/contact-forms')) return 'contact-forms';
    if (pathname === '/dashboard') return 'dashboard';
    return '';
  }, [pathname]);

  const navigationSections = useMemo(
    () => [
      {
        title: 'Overview',
        items: [
          {
            href: `${MIXFLIP_APP}/dashboard/`,
            id: 'dashboard',
            icon: Home,
            label: 'Dashboard'
          },
          {
            href: '/dashboard/account',
            id: 'account',
            icon: CircleUser,
            label: 'Account'
          }
        ]
      },
      {
        title: 'Portfolio',
        items: [
          {
            href: `${MIXFLIP_APP}/dashboard/songs`,
            id: 'songs',
            icon: Music,
            label: 'Song Library'
          },
          {
            href: `${MIXFLIP_APP}/dashboard/players`,
            id: 'players',
            icon: Speaker,
            label: 'Players'
          }
        ]
      },
      {
        title: 'Pages',
        items: [
          {
            href: `${MIXFLIP_APP}/dashboard/landing-pages`,
            id: 'landing-pages',
            icon: FileText,
            label: 'Landing Pages'
          },
          {
            href: `${MIXFLIP_APP}/dashboard/contact-forms`,
            id: 'contact-forms',
            icon: Mail,
            label: 'Contact Forms'
          }
        ]
      }
    ],
    []
  );

  return (
    <div className="hidden md:flex md:flex-col border-r bg-neutral-50 dark:bg-neutral-950 h-screen min-w-[60px] lg:min-w-[180px]">
      <div className="sticky top-0 z-30 flex h-14 items-center border-b px-4 bg-inherit lg:h-[60px] lg:px-6">
        <Link
          className="flex items-center gap-2 font-bold"
          href="https://mixflip.producerapps.com/dashboard/"
        >
          <img
            src={'/favicon.png'}
            alt="MixFlip"
            width={32}
            height={32}
            className="hidden md:block"
          />
          <span className="hidden text-xl lg:block">MixFlip</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {sectionIndex > 0 && (
                <div className="hidden lg:block mx-3 my-2">
                  <div className="h-px bg-border"></div>
                </div>
              )}
              <SectionHeader title={section.title} />
              {section.items.map((link) => (
                <NavLink
                  key={link.id}
                  href={link.href}
                  isSelected={selectedItem === link.id}
                  icon={link.icon}
                  label={link.label}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div className="sticky bottom-0 hidden lg:block bg-inherit">
        <div className="px-2 pt-4 pb-2">
          <Suspense fallback={null}>
            <PromotionBanner variant="sidebar" />
          </Suspense>
        </div>
        <div className="border-t p-4">
          <Suspense>
            <UserLimits />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
