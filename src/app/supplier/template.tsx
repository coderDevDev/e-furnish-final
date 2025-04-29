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
  ChevronRight,
  Settings,
  CreditCard,
  BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { MdInventory2 } from 'react-icons/md';

export default function SupplierTemplate({
  children
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [isSupplier, setIsSupplier] = useState<boolean | null>(null);
  const [supplierStatus, setSupplierStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClientComponentClient();

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

  let links = [
    {
      href: '/supplier/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />
    },
    {
      href: '/supplier/application-status',
      label: 'My Application',
      icon: <FileSignature className="h-4 w-4 mr-2" />
    },
    {
      href: '/supplier/offers',
      label: 'My Offers',
      icon: <FileSignature className="h-4 w-4 mr-2" />
    },
    {
      href: '/supplier/orders',
      label: 'Orders Management',
      icon: <Package className="h-4 w-4 mr-2" />
    },
    {
      href: '/supplier/inventory',
      label: 'Inventory',
      icon: <MdInventory2 className="h-4 w-4 mr-2" />
    },
    {
      href: '/supplier/shipping-settings',
      label: 'Shipping Settings',
      icon: <Truck className="h-4 w-4 mr-2" />
    }
  ];
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full transition-all duration-300 bg-[#F5F5DC] shadow-lg',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}>
        <div className="flex h-full flex-col border-r border-[#D2B48C]">
          {/* Sidebar Header */}
          <div className="flex h-16 flex-col items-center justify-between px-4 mt-10">
            {isSidebarOpen && (
              <span className="text-2xl font-bold tracking-wide text-[#7B3F00]">
                E-FURNISH
              </span>
            )}
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
            <nav className="space-y-2">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-[#7B3F00] text-white shadow-sm'
                      : 'text-[#4B3A2D] hover:bg-[#EEDFCC] hover:text-[#7B3F00]'
                  )}>
                  {link.icon}
                  {isSidebarOpen && <span>{link.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Info and Logout */}
          <div className="px-4 py-4 border-t border-[#D2B48C]">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 rounded-lg px-4 py-2.5 text-[#4B3A2D] hover:bg-[#EEDFCC] hover:text-[#7B3F00] transition-colors">
              <RiLogoutBoxLine size={20} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          'flex-1 overflow-x-hidden transition-all duration-300',
          isSidebarOpen ? 'ml-40' : 'ml-20'
        )}>
        {/* Content Container */}

        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
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
