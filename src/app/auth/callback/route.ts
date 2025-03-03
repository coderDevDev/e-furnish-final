import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (
        error?.status === 429 && // Rate limit error
        retries < maxRetries
      ) {
        const delay = initialDelay * Math.pow(2, retries);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await wait(delay);
        retries++;
        continue;
      }
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  console.log('Starting auth callback with code:', code);

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      // Exchange the code for a session with retry logic
      console.log('Exchanging code for session...');
      const {
        data: { session },
        error: sessionError
      } = await retryWithBackoff(() =>
        supabase.auth.exchangeCodeForSession(code)
      );

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      console.log('Session established:', session?.user?.email);

      // Get user details with retry logic
      console.log('Getting user details...');
      const {
        data: { user },
        error: userError
      } = await retryWithBackoff(() => supabase.auth.getUser());

      console.log('User details:', {
        email: user?.email,
        id: user?.id,
        hasUser: !!user
      });

      if (userError) {
        console.error('User error:', userError);
        return NextResponse.redirect(
          new URL(
            '/auth/error?message=Failed to get user details: ' +
              userError.message,
            request.url
          )
        );
      }

      if (!user) {
        console.error('No user found after successful auth');
        return NextResponse.redirect(
          new URL(
            '/auth/error?message=No user found after authentication',
            request.url
          )
        );
      }

      // Check if admin
      const isAdmin = ['admin@gmail.com', 'efurnish.03@gmail.com'].includes(
        user.email || ''
      );

      console.log('Auth success:', {
        email: user.email,
        isAdmin,
        redirectTo: isAdmin ? '/admin' : '/'
      });

      // Redirect to appropriate page
      return NextResponse.redirect(
        new URL(isAdmin ? '/admin' : '/', request.url)
      );
    } catch (error: any) {
      console.error('Detailed error in auth callback:', error);
      const errorMessage =
        error?.status === 429
          ? 'Too many attempts. Please try again in a moment.'
          : error?.message || 'Authentication failed';

      return NextResponse.redirect(
        new URL(`/auth/error?message=${errorMessage}`, request.url)
      );
    }
  }

  console.error('No code provided in callback');
  return NextResponse.redirect(
    new URL(
      '/auth/error?message=Invalid verification link - no code provided',
      request.url
    )
  );
}
