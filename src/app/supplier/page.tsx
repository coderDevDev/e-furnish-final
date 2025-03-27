'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { Users, Package } from 'lucide-react';

const stats = [
  {
    label: 'Total Products',
    value: '456',
    icon: Package
  },
  {
    label: 'Total Orders',
    value: '123',
    icon: Users
  }
];

export default function SupplierPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Supplier Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
