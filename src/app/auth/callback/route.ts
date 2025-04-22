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

  // Check for OAuth error parameters
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('Starting auth callback with params:', {
    code,
    error,
    errorCode,
    errorDescription
  });

  // Handle OAuth errors first
  if (error || errorCode || errorDescription) {
    let errorMessage = 'Authentication failed';

    if (errorCode === 'otp_expired') {
      errorMessage =
        'The verification link has expired. Please request a new one.';
    } else if (error === 'access_denied') {
      errorMessage = 'Access denied. ' + (errorDescription || '');
    } else if (errorDescription) {
      errorMessage = errorDescription;
    }

    console.error('OAuth error:', { error, errorCode, errorDescription });
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }

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

      // Check if admin by email (consider moving this to database rules)
      const isAdmin = ['admin@gmail.com', 'efurnish.03@gmail.com'].includes(
        user.email || ''
      );

      // Check if a profile record exists for this user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If no profile exists, create one with the appropriate role
      if (!existingProfile && user.id) {
        console.log('Creating new profile for user:', user.email);

        // Set default role based on email pattern
        let role = 'user';
        if (isAdmin) {
          role = 'admin';
        }

        // Insert the new profile
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          username: user.user_metadata?.name || user.email?.split('@')[0] || '',
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }

      // Determine redirect based on existing or newly created role
      let role = 'user';
      if (existingProfile) {
        role = existingProfile.role;
      } else if (isAdmin) {
        role = 'admin';
      }

      console.log('Auth success:', {
        email: user.email,
        role,
        redirectTo:
          role === 'admin' ? '/admin' : role === 'supplier' ? '/supplier' : '/'
      });

      // Redirect based on role
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'supplier') {
        return NextResponse.redirect(new URL('/supplier', request.url));
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error: any) {
      console.error('Detailed error in auth callback:', error);
      const errorMessage =
        error?.status === 429
          ? 'Too many attempts. Please try again in a moment.'
          : error?.message || 'Authentication failed';

      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent(errorMessage)}`,
          request.url
        )
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
