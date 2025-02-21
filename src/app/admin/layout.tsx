import { satoshi } from '@/styles/fonts';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import AdminTemplate from './template';

export const metadata: Metadata = {
  title: 'Admin Panel - Shopco',
  description: 'Admin dashboard for Shopco'
};

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${satoshi.className} h-full antialiased`}>
        <AdminTemplate>{children}</AdminTemplate>
      </body>
    </html>
  );
}
