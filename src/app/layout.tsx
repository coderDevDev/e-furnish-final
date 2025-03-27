import '@/styles/globals.css';
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { satoshi } from '@/styles/fonts';
import TopBanner from '@/components/layout/Banner/TopBanner';
import TopNavbar from '@/components/layout/Navbar/TopNavbar';
import Footer from '@/components/layout/Footer';
import HolyLoader from 'holy-loader';
import { Providers } from '@/lib/providers';
import QueryProvider from '@/providers/QueryProvider';
import { headers } from 'next/headers';
import { Toaster } from 'sonner';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';

export const metadata: Metadata = {
  title: 'eFurnish',
  description: 'Your one-stop furniture shop'
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

    let adminEmails = ['admin@gmail.com', 'efurnish.03@gmail.com'];

    console.log({ profile });
    return ['admin', 'supplier'].includes(profile?.role || '');
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  // Get the full URL from the request header
  const requestUrl = headersList.get('x-invoke-path') || '';
  const isAdmin = await checkAdminAccess();
  const isAuthRoute =
    requestUrl.startsWith('/login') || requestUrl.startsWith('/register');
  const useMinimalLayout = isAdmin || isAuthRoute;

  console.log({ isAdmin });
  //console.log('RootLayout:', {
  //   requestUrl,
  //   isAdmin,
  //   useMinimalLayout,
  //   headers: Object.fromEntries(headersList.entries())
  // });

  if (useMinimalLayout) {
    return (
      <html lang="en" className="h-full">
        <body className={`${satoshi.className} h-full antialiased`}>
          <HolyLoader color="#868686" />
          <Providers>{children}</Providers>
          <Toaster position="top-right" expand={true} richColors richColors />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={satoshi.className}>
        <HolyLoader color="#868686" />
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
