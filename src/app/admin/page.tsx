'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { Users, Package, DollarSign, PackageSearch } from 'lucide-react';

const stats = [
  {
    label: 'Total Users',
    value: '1,234',
    icon: Users,
    change: '+12%'
  },
  {
    label: 'Total Products',
    value: '456',
    icon: Package,
    change: '+23%'
  },
  {
    label: 'Total Revenue',
    value: '$12,345',
    icon: DollarSign,
    change: '+8%'
  },
  {
    label: 'Low Stock Items',
    value: '23',
    icon: PackageSearch,
    change: '-5%'
  }
];

export default function AdminPage() {
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
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {/* Stats Grid */}
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
                <p
                  className={`mt-1 text-sm font-medium ${
                    stat.change.startsWith('+')
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
                <stat.icon size={24} />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/40 to-primary" />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Activity
        </h2>
        <div className="mt-4 space-y-4">
          {/* Add your activity content here */}
          <div className="h-[200px] rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            Activity Content Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
