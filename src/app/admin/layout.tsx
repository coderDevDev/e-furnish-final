import type { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminTemplate from './template';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Admin Panel - eFurnish',
  description: 'Admin dashboard for eFurnish'
};

async function checkAdminAccess() {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Check if user is authenticated
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    console.log({ profile });
    let adminEmails = ['admin@gmail.com', 'efurnish.03@gmail.com'];

    return adminEmails.includes(profile?.email || '');
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await checkAdminAccess();

  if (!isAdmin) {
    redirect('/login');
  }

  return (
    <>
      <AdminTemplate>{children}</AdminTemplate>
      <Toaster position="top-right" richColors />
    </>
  );
}
