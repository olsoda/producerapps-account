import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { createClient } from '@/utils/supabase/server';
import { ModeToggle } from '@/components/ui/darkmode';

export default async function UserHeader() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const displayName =
    (user.user_metadata?.first_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email;

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="hidden sm:block text-xs md:text-sm text-muted-foreground">
        Hello,{' '}
        <span className="font-medium text-foreground">{displayName}</span>
      </div>
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-full"
            size="icon"
            variant="secondary"
            aria-label="Open user menu"
          >
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/account/">Account Settings</Link>
          </DropdownMenuItem>
          {/* <DropdownMenuItem asChild>
            <Link href="/dashboard/affiliate-program">Affiliate Program</Link>
          </DropdownMenuItem> */}
          <DropdownMenuItem asChild>
            <Link href="https://docs.mixflip.io/">Documentation</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <SignOutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
