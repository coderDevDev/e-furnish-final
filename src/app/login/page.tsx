'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (loading) return; // Prevent multiple submissions

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

      const isUser = email !== 'admin@gmail.com';

      console.log({ isUser });

      if (data.session) {
        toast.success('Logged in successfully');
        window.location.href = isUser ? '/' : '/admin';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
            <p className="mt-2 text-sm text-slate-600">
              Sign in to access the system
            </p>
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
