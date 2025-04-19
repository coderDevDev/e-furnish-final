'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiMenu } from 'react-icons/fi';

interface AdminNavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  role: string | null;
}

export function AdminNavbar({
  toggleSidebar,
  isSidebarOpen,
  role
}: AdminNavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-amber-100 to-amber-200 border-b border-amber-300 text-amber-900 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md hover:bg-amber-300/20">
          <FiMenu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold capitalize">
          {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium">
          Welcome, {role === 'admin' ? 'Administrator' : 'Supplier'}
        </div>
      </div>
    </nav>
  );
}
