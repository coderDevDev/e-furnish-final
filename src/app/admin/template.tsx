'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  RiDashboardLine,
  RiSettings4Line,
  RiUser3Line,
  RiLogoutBoxLine
} from 'react-icons/ri';
import {
  MdInventory2,
  MdOutlineProductionQuantityLimits
} from 'react-icons/md';
import { FiMenu } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { ListOrderedIcon } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';

const adminLinks = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: RiDashboardLine
  },
  {
    label: 'Orders',
    href: '/admin/customer-orders',
    icon: ListOrderedIcon
  },
  {
    label: 'Inventory',
    href: '/admin/inventory-supplier',
    icon: MdInventory2
  },
  {
    label: 'My Account',
    href: '/admin/my-account',
    icon: RiUser3Line
  },
  {
    label: 'Shipping Settings',
    href: '/admin/settings',
    icon: RiSettings4Line
  }
];

const supplierLinks = [
  {
    label: 'Supplier Settings',
    href: '/admin/inventory-supplier',
    icon: MdInventory2
  }
];

export default function AdminTemplate({
  children
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('No session found');
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          throw error;
        }

        setRole(profile.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        toast.error('Failed to fetch user role');
      }
    };

    fetchUserRole();
  }, [supabase]);

  const links = role === 'admin' ? adminLinks : supplierLinks;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-white transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}>
        <div className="flex h-full flex-col border-r border-slate-100">
          {/* Sidebar Header */}
          <div className="flex h-16 flex-col items-center justify-between px-4 mt-10">
            {isSidebarOpen && (
              <span className="text-xl font-semibold text-slate-900">
                E-FURNISH
              </span>
            )}
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-xl px-4 py-2.5 transition-colors',
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}>
                  <link.icon size={20} />
                  {isSidebarOpen && <span>{link.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Info and Logout */}
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
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
