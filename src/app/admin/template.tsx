'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { RiDashboardLine, RiSettings4Line, RiUser3Line } from 'react-icons/ri';
import {
  MdInventory2,
  MdOutlineProductionQuantityLimits
} from 'react-icons/md';
import { FiMenu } from 'react-icons/fi';

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

  return (
    <div className="min-h-screen bg-[#F0EEED]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}>
        <div className="flex h-full flex-col justify-between border-r border-black/5">
          <div>
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6">
              <Link href="/admin" className="text-xl font-bold">
                {isSidebarOpen ? 'Admin Panel' : 'AP'}
              </Link>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-black/60 hover:text-black">
                <FiMenu size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 px-3 py-4">
              {sidebarLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
                    pathname === link.href
                      ? 'bg-black/5 text-black'
                      : 'text-black/60 hover:bg-black/5 hover:text-black'
                  )}>
                  <link.icon size={20} />
                  {isSidebarOpen && <span>{link.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Info */}
          <div className="border-t border-black/5 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-black/5" />
              {isSidebarOpen && (
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-black/60">admin@example.com</p>
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/5 bg-white px-6">
          <h1 className="text-xl font-semibold">
            {sidebarLinks.find(link => link.href === pathname)?.label ||
              'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="text-black/60 hover:text-black">
              <IoMdNotificationsOutline size={24} />
            </button>
            <button className="text-black/60 hover:text-black">
              <RiSettings4Line size={24} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
