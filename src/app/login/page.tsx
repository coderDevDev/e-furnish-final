'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'supplier' | 'admin'>('user');
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  // Debounce the email and password to prevent rapid API calls
  const debouncedEmail = useDebounce(email, 500);
  const debouncedPassword = useDebounce(password, 500);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    if (message) {
      toast.success(message);
    }
  }, [message]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      console.log({ session });
      if (session) {
        // Get the user's role
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log({ userData });
        // Redirect based on role
        if (userData?.role === 'admin') {
          setIsLoggedIn(true);
          window.location.href = '/admin';
        } else if (userData?.role === 'supplier') {
          setIsLoggedIn(true);
          window.location.href = '/supplier';
        } else {
          setIsLoggedIn(true);
          window.location.href = '/';
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, []);

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

      // Get user role from profiles table
      const { data: userData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data?.user?.id)
        .single();

      if (roleError) {
        toast.error('Failed to fetch user role.');
        return;
      }

      // Check if selected role matches the user's actual role
      if (userData?.role !== role) {
        toast.error(
          `Invalid role selected. You are a ${userData?.role}, not a ${role}.`
        );
        // Sign out the user since role doesn't match
        await supabase.auth.signOut();
        return;
      }

      if (data.session) {
        toast.success('Logged in successfully');

        if (userData.role === 'admin') {
          window.location.href = '/admin';
        } else if (userData.role === 'supplier') {
          window.location.href = '/supplier';
        } else {
          window.location.href = '/';
        }
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

  // Handler for when role is selected
  const handleRoleSelect = (selectedRole: 'user' | 'supplier' | 'admin') => {
    setRole(selectedRole);
    setShowLoginForm(true);
  };

  return isLoggedIn === false ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Welcome to eFurnish
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Please select your role to continue
          </p>
        </div>

        {!showLoginForm ? (
          // Show only role selector initially
          <div className="mt-8 bg-white py-10 px-6 shadow-xl sm:rounded-lg sm:px-12">
            <RoleSelector onSelect={handleRoleSelect} selectedRole={role} />
          </div>
        ) : (
          // Show login form after role is selected
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLoginForm(false)}
                  className="text-primary hover:text-primary/80 text-base flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Change Role
                </button>
              </div>
              <div className="text-base">
                Selected Role:{' '}
                <span className="font-medium capitalize">{role}</span>
              </div>
            </div>

            <div className="mt-4 bg-white py-10 px-6 shadow-xl sm:rounded-lg sm:px-12">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-semibold text-slate-900">Login</h1>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-base font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your email"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-base font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Enter your password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-primary mt-2"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:bg-primary/50">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-base">
                  <span className="bg-white px-3 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 py-6 text-base"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}>
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <FcGoogle className="mr-2 h-6 w-6" />
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-base text-gray-600 mt-4">
              Don't have an account?{' '}
              <a
                href={`/register?role=${role}`}
                className="font-medium text-primary hover:text-primary/80">
                Register here
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  ) : (
    <div></div>
  );
}
