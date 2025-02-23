import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      await supabase.auth.exchangeCodeForSession(code);
      // Redirect to login page with success message
      return NextResponse.redirect(
        new URL(
          '/login?message=Email confirmed successfully! You can now login.',
          request.url
        )
      );
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Redirect to error page if something goes wrong
      return NextResponse.redirect(
        new URL('/auth/error?message=Could not verify email', request.url)
      );
    }
  }

  // Return 400 if code is missing
  return NextResponse.redirect(
    new URL('/auth/error?message=Invalid verification link', request.url)
  );
}
