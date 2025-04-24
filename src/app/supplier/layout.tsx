import { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Supplier Portal - eFurnish',
  description: 'Supplier Portal for eFurnish - Manage your offers and orders'
};

export default function SupplierLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen`}>
      <div className="flex-1 flex justify-center py-4 sm:py-6">
        <div className="w-full max-w-7xl">{children}</div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
