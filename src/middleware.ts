import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  // If accessing admin routes, verify admin role
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    console.log({ profile: profile.role });

    // if (!profile || profile.role !== 'admin' || profile.role !== 'supplier') {
    //   return NextResponse.redirect(new URL('/', request.url));
    // }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*']
};
