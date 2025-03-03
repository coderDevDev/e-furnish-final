'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'supplier' | 'admin'>('user');
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  // Debounce the email and password to prevent rapid API calls
  const debouncedEmail = useDebounce(email, 500);
  const debouncedPassword = useDebounce(password, 500);

  useEffect(() => {
    if (message) {
      toast.success(message);
    }
  }, [message]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: debouncedEmail,
        password: debouncedPassword
      });

      if (error) {
        if (error.message === 'Request rate limit reached') {
          toast.error('Too many login attempts. Please try again in a moment.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      const isAdmin = ['admin@gmail.com', 'efurnish.03@gmail.com'].includes(
        email
      );

      if (data.session) {
        toast.success('Logged in successfully');
        window.location.href = isAdmin ? '/admin' : '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      console.log('Starting Google login...');

      // Clear existing session first
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error clearing session:', signOutError);
        toast.error('Failed to clear existing session');
        return;
      }

      // Wait briefly for session to clear
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        if (error.message.includes('provider is not enabled')) {
          toast.error(
            'Google sign-in is not configured. Please try email login or contact support.'
          );
        } else {
          toast.error('Failed to sign in with Google: ' + error.message);
        }
        return;
      }

      // If we have a URL, the OAuth flow will continue
      if (data?.url) {
        console.log('Redirecting to Google auth:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No URL received for Google auth redirect');
        toast.error('Failed to start Google authentication');
      }
    } catch (error: any) {
      console.error('Detailed Google login error:', error);
      toast.error(
        'An unexpected error occurred during Google sign-in: ' + error.message
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select your role to continue
          </p>
        </div>

        <RoleSelector onSelect={setRole} selectedRole={role} />

        <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
            {/* <p className="mt-2 text-sm text-slate-600">
              Sign in to access the system
            </p> */}
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-2 text-white hover:bg-primary/90 disabled:bg-primary/50">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}>
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <FcGoogle className="mr-2 h-5 w-5" />
                <span>Sign in with Google</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a
            href={`/register?role=${role}`}
            className="font-medium text-primary hover:text-primary/80">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
