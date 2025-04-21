'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  LayoutDashboard,
  FileSignature,
  Package,
  Truck,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SupplierTemplate({
  children
}: {
  children: React.ReactNode;
}) {
  const [isSupplier, setIsSupplier] = useState<boolean | null>(null);
  const [supplierStatus, setSupplierStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    checkSupplierStatus();
  }, []);

  const checkSupplierStatus = async () => {
    try {
      // Check if user is logged in
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setIsSupplier(false);
        setLoading(false);
        return;
      }

      // Check if supplier exists
      const { data, error } = await supabase
        .from('suppliers')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking supplier status:', error);
      }

      setIsSupplier(!!data);
      setSupplierStatus(data?.status || null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pages that don't require supplier access
  const isPublicPage =
    pathname === '/supplier/register' ||
    pathname === '/supplier/application-status';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b bg-[#B08968] text-white p-3 flex justify-between">
        <div className="container flex items-center py-4 text-sm">
          <Link
            href="/supplier/dashboard"
            className="text-white hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 text-white" />
          <Link
            href="/supplier/dashboard"
            className="text-white hover:text-foreground">
            Supplier
          </Link>
          {pathname !== '/supplier' && (
            <>
              <ChevronRight className="h-4 w-4 mx-2 text-white" />
              <span className="font-medium">
                {pathname.includes('/dashboard')
                  ? 'Dashboard'
                  : pathname.includes('/application')
                  ? 'Application'
                  : pathname.includes('/offers')
                  ? 'Offers & Deals'
                  : pathname.includes('/orders')
                  ? 'Orders'
                  : 'Page'}
              </span>
            </>
          )}
        </div>
        <Button className="mt-2" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="flex-1 container grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 py-8">
        {/* Sidebar */}
        <nav className="hidden md:block space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Supplier Portal</h3>

            <div className="space-y-1">
              <NavLink
                href="/supplier/dashboard"
                active={pathname === '/supplier/dashboard'}
                icon={<LayoutDashboard className="h-4 w-4 mr-2" />}
                disabled={supplierStatus !== 'approved'}>
                Dashboard
              </NavLink>

              <NavLink
                href="/supplier/application-status"
                active={pathname === '/supplier/application-status'}
                icon={<FileSignature className="h-4 w-4 mr-2" />}>
                My Application
              </NavLink>

              <NavLink
                href="/supplier/offers"
                active={pathname.includes('/supplier/offers')}
                icon={<Package className="h-4 w-4 mr-2" />}
                disabled={supplierStatus !== 'approved'}>
                My Offers & Deals
              </NavLink>

              <NavLink
                href="/supplier/orders"
                active={pathname.includes('/supplier/orders')}
                icon={<Truck className="h-4 w-4 mr-2" />}
                disabled={supplierStatus !== 'approved'}>
                Orders from Owner
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function NavLink({
  href,
  active,
  children,
  icon,
  disabled = false
}: NavLinkProps) {
  if (disabled) {
    return (
      <div className="flex items-center px-3 py-2 text-sm rounded-md text-muted-foreground cursor-not-allowed opacity-70">
        {icon}
        {children}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}>
      {icon}
      {children}
    </Link>
  );
}
