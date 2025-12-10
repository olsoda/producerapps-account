// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Safely get pathname - ensure it's defined
  const pathname = request.nextUrl?.pathname || '';

  // Check auth state
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // If there's no user and the path starts with /dashboard, redirect to /login
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there's a user and the path is /login or /, redirect to /dashboard
  if (
    user &&
    (pathname === '/login' || pathname === '/' || pathname === '/signup')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/signup', '/login', '/dashboard/:path*']
};
