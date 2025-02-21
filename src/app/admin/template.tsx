'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { RiDashboardLine, RiSettings4Line, RiUser3Line } from 'react-icons/ri';
import {
  MdInventory2,
  MdOutlineProductionQuantityLimits
} from 'react-icons/md';
import { FiMenu } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/config';

const sidebarLinks = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: RiDashboardLine
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: RiUser3Line
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: MdOutlineProductionQuantityLimits
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    icon: MdInventory2
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: RiSettings4Line
  }
];

export default function AdminTemplate({
  children
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = '/login';
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login';
      }
    };

    checkAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        window.location.href = '/login';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white shadow-sm transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}>
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
              <Link href="/admin" className="text-xl font-bold text-primary">
                {isSidebarOpen ? 'Admin Panel' : 'AP'}
              </Link>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <FiMenu size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 p-4">
              {sidebarLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-xl px-4 py-3 transition-all',
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                  )}>
                  <link.icon size={20} />
                  {isSidebarOpen && <span>{link.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Info */}
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10" />
              {isSidebarOpen && (
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Admin User
                  </p>
                  <p className="text-xs text-slate-500">admin@example.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          isSidebarOpen ? 'ml-64' : 'ml-20'
        )}>
        {/* Top Header */}
        {/* <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            {sidebarLinks.find(link => link.href === pathname)?.label ||
              'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <IoMdNotificationsOutline size={24} />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <RiSettings4Line size={24} />
            </button>
          </div>
        </header> */}

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
