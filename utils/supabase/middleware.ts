//path to the file: utils/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const SHARED_DOMAIN = '.producerapps.com';

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const applyCookie = (
    name: string,
    value: string,
    options: CookieOptions,
    domain?: string
  ) => {
    const cookieOptions = domain ? { ...options, domain } : options;

    // Keep request cookies in sync so Supabase can read the new value immediately
    request.cookies.set({
      name,
      value,
      ...cookieOptions
    });

    response = NextResponse.next({
      request: {
        headers: request.headers
      }
    });

    response.cookies.set({
      name,
      value,
      ...cookieOptions
    });
  };

  const setCookieAcrossDomains = (
    name: string,
    value: string,
    options: CookieOptions
  ) => {
    if (isProduction) {
      // In production, set cookie with shared domain so it works across all subdomains
      applyCookie(name, value, options, SHARED_DOMAIN);
    } else {
      // In development, use default domain (localhost)
      applyCookie(name, value, options);
    }
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          setCookieAcrossDomains(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          setCookieAcrossDomains(name, '', options);
        }
      }
    }
  );

  return { supabase, response };
};

export const updateSession = async (request: NextRequest) => {
  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    const { supabase, response } = createClient(request);

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    await supabase.auth.getUser();

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    });
  }
};
