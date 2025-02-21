'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
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

const sidebarLinks = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: RiDashboardLine
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: MdOutlineProductionQuantityLimits
  },
  {
    label: 'Inventory',
    href: '/admin/inventory-supplier',
    icon: MdInventory2
  },

  {
    label: 'Users',
    href: '/admin/users',
    icon: RiUser3Line
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
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const supabase = createClientComponentClient();

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
          <div className="flex h-16 items-center justify-between px-4">
            {isSidebarOpen && (
              <span className="text-xl font-semibold text-slate-900">
                Admin
              </span>
            )}
            {/* <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <FiMenu size={20} />
            </button> */}
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {sidebarLinks.map(link => (
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
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10" />
              {isSidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Admin User
                  </p>
                  <p className="text-xs text-slate-500">admin@example.com</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className={cn(
                'mt-4 flex w-full items-center space-x-3 rounded-xl px-4 py-2.5 text-slate-600 transition-colors',
                'hover:bg-red-50 hover:text-red-600',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}>
              <RiLogoutBoxLine size={20} />
              {isSidebarOpen && (
                <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-x-hidden transition-all duration-300',
          isSidebarOpen ? 'ml-40' : 'ml-20'
        )}>
        <div className="px-5 py-4">{children}</div>
      </main>
    </div>
  );
}
