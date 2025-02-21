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

export default function AdminDashboard() {
  return (
    <div className="">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-white rounded-[20px] p-6 shadow-sm border border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/60">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p
                  className={`text-sm ${
                    stat.change.startsWith('+')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                  {stat.change} from last month
                </p>
              </div>
              <stat.icon size={40} className="text-black/20" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[20px] p-6 shadow-sm border border-black/5">
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        {/* Add your activity content here */}
      </div>
    </div>
  );
}
