'use client';

import { usePathname } from 'next/navigation';
import TopBanner from '@/components/layout/Banner/TopBanner';
import TopNavbar from '@/components/layout/Navbar/TopNavbar';
import Footer from '@/components/layout/Footer';
import QueryProvider from '@/providers/QueryProvider';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');
  const isAdminRoute = pathname.startsWith('/admin');
  const useMinimalLayout = isAuthRoute || isAdminRoute;

  if (useMinimalLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBanner />
      <QueryProvider>
        <TopNavbar />
        {children}
        <Footer />
      </QueryProvider>
    </>
  );
}
