import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    // Refresh session if expired
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    // Debug session state
    console.log('Session state:', { session, path: request.nextUrl.pathname });

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        // No session, redirect to login
        const redirectUrl = new URL('/login', request.url);
        return NextResponse.redirect(redirectUrl);
      }
      // Has session, allow access
      return res;
    }

    // Handle login page access
    if (request.nextUrl.pathname === '/login') {
      if (session) {
        // Already logged in, redirect to admin
        const redirectUrl = new URL('/admin', request.url);
        return NextResponse.redirect(redirectUrl);
      }
      // Not logged in, allow access to login
      return res;
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow request but log it
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
