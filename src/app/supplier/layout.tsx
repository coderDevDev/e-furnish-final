'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import {
  RiDashboardLine,
  RiUser3Line,
  RiFileTextLine,
  RiFileListLine
} from 'react-icons/ri';
const supplierLinks = [
  {
    label: 'Dashboard',
    href: '/supplier',
    icon: RiDashboardLine
  },
  {
    label: 'Profile Verification',
    href: '/supplier/profile',
    icon: RiUser3Line
  },
  // {
  //   label: 'Materials',
  //   href: '/supplier/materials'
  // },
  {
    label: 'Material Offers',
    href: '/supplier/offers',
    icon: RiFileTextLine
  },
  {
    label: 'Owner Orders',
    href: '/supplier/orders',
    icon: RiFileTextLine
  },
  {
    label: 'Transactions',
    href: '/supplier/transactions',
    icon: RiFileListLine
  }
];

export default function SupplierLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-white transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}>
        <div className="flex h-full flex-col border-r border-slate-100">
          <div className="flex h-16 items-center justify-between px-4">
            {isSidebarOpen && (
              <span className="text-xl font-semibold text-slate-900">
                Supplier
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {/* add the icon  */}
              {supplierLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-xl px-4 py-2.5 transition-colors',
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}>
                  {link.icon && <link.icon className="w-6 h-6 mr-4" />}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              Logout
            </button>
          </div>
        </div>
      </aside>
      <main
        className={cn(
          'flex-1 overflow-x-hidden transition-all duration-300',
          isSidebarOpen ? 'ml-80' : 'ml-20'
        )}>
        <div className="px-5 py-4">{children}</div>
      </main>
    </div>
  );
}
