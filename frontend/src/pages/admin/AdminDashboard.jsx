import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiUserLine, RiShoppingBagLine, RiShoppingCartLine, RiMoneyDollarCircleLine, RiAlertLine } from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader } from '../../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [salesTab, setSalesTab] = useState('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const { stats, recentOrders = [], lowStockProducts = [], ordersByStatus = [], monthlySales = [] } = data || {};

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: RiMoneyDollarCircleLine, color: 'from-primary-600 to-blue-500', change: '+12%' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: RiShoppingCartLine, color: 'from-emerald-500 to-teal-400', change: '+8%' },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: RiShoppingBagLine, color: 'from-amber-500 to-orange-400', change: '+3%' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: RiUserLine, color: 'from-purple-500 to-violet-400', change: '+15%' },
  ];

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dailySalesTotal = monthlySales.filter(o => new Date(o.createdAt) >= startOfDay).reduce((sum, o) => sum + o.totalAmount, 0);
  const weeklySalesTotal = monthlySales.filter(o => new Date(o.createdAt) >= startOfWeek).reduce((sum, o) => sum + o.totalAmount, 0);
  const monthlySalesTotal = monthlySales.reduce((sum, o) => sum + o.totalAmount, 0);

  const isSameDay = (date1, date2) => date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();

  let salesChartData = [];
  if (salesTab === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const daySales = monthlySales.filter(o => isSameDay(new Date(o.createdAt), d)).reduce((sum, o) => sum + o.totalAmount, 0);
      salesChartData.push({ day: dateStr, sales: daySales });
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = `${d.getDate()}/${d.getMonth()+1}`;
      const daySales = monthlySales.filter(o => isSameDay(new Date(o.createdAt), d)).reduce((sum, o) => sum + o.totalAmount, 0);
      salesChartData.push({ day: dateStr, sales: daySales });
    }
  }

  const statusChartData = ordersByStatus.map((s) => ({
    status: s.status,
    count: s._count.status,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard Overview</h1>
        <p className="text-secondary-500 text-sm mt-1">Welcome back, Admin! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="card p-5 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.06]`} />
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-black text-secondary-900">{value}</p>
              <p className="text-secondary-500 text-sm mt-0.5">{label}</p>
              <span className="text-green-600 text-xs font-semibold">{change} this month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        {/* Sales Chart */}
        <div className="card p-6">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-6 gap-4">
            <h2 className="font-bold text-secondary-900 mb-0">Sales Analytics</h2>
            <div className="flex bg-secondary-50 p-1 rounded-xl self-start xl:self-auto">
              {['weekly', 'monthly'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setSalesTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${salesTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
             <div className="p-3 bg-secondary-50 rounded-2xl border border-secondary-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1">Today</p>
                <p className="text-sm lg:text-base font-bold text-secondary-900">{formatPrice(dailySalesTotal)}</p>
             </div>
             <div className="p-3 bg-secondary-50 rounded-2xl border border-secondary-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1">7 Days</p>
                <p className="text-sm lg:text-base font-bold text-secondary-900">{formatPrice(weeklySalesTotal)}</p>
             </div>
             <div className="p-3 bg-secondary-50 rounded-2xl border border-secondary-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1">30 Days</p>
                <p className="text-sm lg:text-base font-bold text-secondary-900">{formatPrice(monthlySalesTotal)}</p>
             </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => [formatPrice(v), 'Sales']} />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        {statusChartData.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-secondary-900 mb-4">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900">Recent Orders</h2>
          </div>
          <div className="divide-y divide-secondary-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-secondary-900 text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-secondary-500">{order.user?.firstName} {order.user?.lastName}</p>
                  <p className="text-xs text-secondary-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary-900 text-sm">{formatPrice(order.totalAmount)}</p>
                  <span className={`badge ${STATUS_COLORS[order.status] || ''} capitalize text-xs mt-1`}>{order.status}</span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="p-6 text-secondary-500 text-sm text-center">No recent orders</p>}
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
              <RiAlertLine size={18} className="text-amber-500" /> Low Stock Alert
            </h2>
          </div>
          <div className="divide-y divide-secondary-100">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900 text-sm line-clamp-1">{product.name}</p>
                  <p className="text-xs text-secondary-500 font-mono">{product.sku}</p>
                </div>
                <span className={`badge ${product.stock === 0 ? 'badge-danger' : 'badge-warning'} text-xs`}>
                  {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && <p className="p-6 text-secondary-500 text-sm text-center">All products well stocked! ✓</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
