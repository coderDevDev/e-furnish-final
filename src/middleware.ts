import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    // Refresh session
    const {
      data: { session }
    } = await supabase.auth.getSession();

    // For debugging
    console.log('Middleware session:', {
      hasSession: !!session,
      path: request.nextUrl.pathname,
      userId: session?.user?.id
    });

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Handle login page
    if (request.nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth callback)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
};
