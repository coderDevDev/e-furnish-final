import type { Metadata } from 'next';
import AdminTemplate from './template';
import { Toaster } from 'sonner';

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
    <>
      <AdminTemplate>{children}</AdminTemplate>
      <Toaster position="top-right" richColors />
    </>
  );
}
