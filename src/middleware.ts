import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't need auth
const publicRoutes = ['/login', '/register', '/', '/shop'];

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes and static files
  if (
    publicRoutes.some(route => request.nextUrl.pathname.startsWith(route)) ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg)$/)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    // Get session from Supabase (this uses cached session when available)
    const {
      data: { session }
    } = await supabase.auth.getSession();

    // Redirect to login if no session
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Only check role for admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Get user profile with role (this can be cached)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || !['admin', 'supplier'].includes(profile.role)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return res;
  } catch (error) {
    // On error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Only run middleware for relevant routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ]
};
