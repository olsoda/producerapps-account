'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/utils/supabase/signout';
import { Button } from './ui/button';

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
    localStorage.clear();
    sessionStorage.clear();

    console.log('poop');
  };

  return (
    <button onClick={handleSignOut} className="justify-start w-full text-left">
      Sign Out
    </button>
  );
};

export default SignOutButton;
