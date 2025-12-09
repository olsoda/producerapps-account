'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import UserLimits from '@/components/UserLimits';
import { Home, CircleUser, Music, Speaker } from 'lucide-react';
import { useState } from 'react';

const MIXFLIP_APP = 'https://mixflip.producerapps.com';

export function MobileNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const getSelectedItem = (path: string) => {
    if (path === '/dashboard') return 'dashboard';
    if (path === '/dashboard/songs') return 'songs';
    if (path === '/dashboard/players') return 'players';
    if (path === '/dashboard/contact-forms') return 'contact-forms';
    if (path === '/dashboard/account') return 'account';
    return '';
  };

  const selectedItem = getSelectedItem(pathname);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div
      className={`flex flex-col gap-4 p-4 h-full justify-between ${isOpen ? 'block' : 'hidden'}`}
    >
      <nav className="grid gap-2 font-medium">
        <Link
          className="flex items-center gap-2 mb-4 text-lg font-semibold"
          href="#"
        >
          <Image src={'/favicon.png'} alt="MixFlip" width={24} height={24} />
          <span className="text-xl">MixFlip</span>
        </Link>
        <Link
          className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${
            selectedItem === 'dashboard'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          }`}
          href="/dashboard"
          onClick={handleLinkClick}
        >
          <Home className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${
            selectedItem === 'songs'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          }`}
          href={`${MIXFLIP_APP}/dashboard/songs`}
          target="_blank"
          rel="noreferrer"
          onClick={handleLinkClick}
        >
          <Music className="w-5 h-5" />
          Songs
        </Link>
        <Link
          className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${
            selectedItem === 'players'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          }`}
          href={`${MIXFLIP_APP}/dashboard/players`}
          target="_blank"
          rel="noreferrer"
          onClick={handleLinkClick}
        >
          <Speaker className="w-5 h-5" />
          Players
        </Link>
        <Link
          className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${
            selectedItem === 'account'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          }`}
          href="/dashboard/account"
          onClick={handleLinkClick}
        >
          <CircleUser className="w-5 h-5" />
          Account
        </Link>
      </nav>
      <UserLimits />
    </div>
  );
}
