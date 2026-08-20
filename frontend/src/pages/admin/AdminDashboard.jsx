import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  RiUserLine, RiShoppingBagLine, RiShoppingCartLine, RiMoneyDollarCircleLine, RiAlertLine,
  RiUserAddLine, RiChat3Line, RiStarLine, RiAddLine, RiPercentLine, RiSettings3Line,
  RiHistoryLine, RiSparklingFill, RiScales3Line
} from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader } from '../../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const DONUT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminDashboard() {
  const [salesTab, setSalesTab] = useState('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const {
    stats,
    recentOrders = [],
    lowStockProducts = [],
    ordersByStatus = [],
    monthlySales = [],
    bestSellers = [],
    brandShare = [],
    activities = []
  } = data || {};

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

  // Target goal ring configurations
  const salesGoalTarget = 1500000;
  const goalPercentage = Math.min(Math.round((monthlySalesTotal / salesGoalTarget) * 100), 100);
  const strokeDashoffset = 251.2 - (251.2 * goalPercentage) / 100;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 uppercase tracking-tight">Dashboard Overview</h1>
          <p className="text-secondary-500 text-xs mt-1 font-medium">Welcome back, Admin! Here is your smartphone store stats, activities, and brand diagnostics.</p>
        </div>
      </div>

      {/* Prominent Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-200">
                <RiAlertLine size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-red-900 text-base flex items-center gap-2">
                  <span>Critical Low Stock Warning</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{lowStockProducts.length} Alert(s)</span>
                </h3>
                <p className="text-red-700 text-xs mt-1 font-medium">
                  {lowStockProducts.length} smartphone(s) have 5 or fewer items remaining in stock. Please restock to prevent stockouts!
                </p>
              </div>
            </div>
            <Link
              to="/admin/products"
              className="btn-primary py-2.5 px-5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border-0 shadow-md flex-shrink-0 flex items-center justify-center gap-1.5"
            >
              Restock Products Now
            </Link>
          </div>
        </div>
      )}

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

      {/* Operations Quick Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/warranty"
          className="card p-3.5 hover:border-primary-400 hover:shadow-md transition-all flex items-center gap-3 bg-gradient-to-br from-blue-50/50 to-white"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            📱
          </div>
          <div>
            <p className="text-xs font-bold text-secondary-500 uppercase">Active Warranty</p>
            <p className="text-lg font-black text-secondary-900">{stats?.activeWarrantyCount || 0}</p>
          </div>
        </Link>

        <Link
          to="/admin/repairs"
          className="card p-3.5 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3 bg-gradient-to-br from-amber-50/50 to-white"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            🛠️
          </div>
          <div>
            <p className="text-xs font-bold text-secondary-500 uppercase">Pending Repairs</p>
            <p className="text-lg font-black text-secondary-900">{stats?.pendingRepairsCount || 0}</p>
          </div>
        </Link>

        <Link
          to="/admin/trade-ins"
          className="card p-3.5 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3 bg-gradient-to-br from-purple-50/50 to-white"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            🔄
          </div>
          <div>
            <p className="text-xs font-bold text-secondary-500 uppercase">Open Trade-Ins</p>
            <p className="text-lg font-black text-secondary-900">{stats?.pendingTradeInsCount || 0}</p>
          </div>
        </Link>

        <Link
          to="/admin/abandoned-carts"
          className="card p-3.5 hover:border-rose-400 hover:shadow-md transition-all flex items-center gap-3 bg-gradient-to-br from-rose-50/50 to-white"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            🛒
          </div>
          <div>
            <p className="text-xs font-bold text-secondary-500 uppercase">Abandoned Carts</p>
            <p className="text-lg font-black text-secondary-900">{stats?.abandonedCartsCount || 0}</p>
          </div>
        </Link>
      </div>

      {/* Row 1: Sales Analytics (Line Chart) + Target Progress Ring */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-8 card p-6">
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

        {/* Goals Progress Ring */}
        <div className="lg:col-span-4 card p-6 flex flex-col justify-between items-center relative overflow-hidden bg-white">
          <div className="w-full">
            <h2 className="font-bold text-secondary-900 mb-1">Monthly Sales Target</h2>
            <p className="text-xs text-secondary-400 font-medium">LKR Target vs Current Sales Volume</p>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle cx="64" cy="64" r="50" stroke="#2563eb" strokeWidth="10" fill="transparent"
                strokeDasharray="314.16" strokeDashoffset={314.16 - (314.16 * goalPercentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-secondary-900">{goalPercentage}%</span>
              <span className="text-[9px] font-black uppercase text-secondary-400 tracking-wider">Goal Achieved</span>
            </div>
          </div>

          <div className="w-full text-center space-y-1">
            <p className="text-xs font-semibold text-secondary-500">Target: <span className="font-extrabold text-secondary-900">{formatPrice(salesGoalTarget)}</span></p>
            <p className="text-xs font-semibold text-secondary-500">Achieved: <span className="font-extrabold text-primary-650">{formatPrice(monthlySalesTotal)}</span></p>
          </div>
        </div>
      </div>

      {/* Row 2: Orders by Status (Bar Chart) + Brand Market Share Donut Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        {statusChartData.length > 0 && (
          <div className="card p-6 flex flex-col justify-between">
            <h2 className="font-bold text-secondary-900 mb-4">Orders by Status</h2>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Brand Sales Donut Chart */}
        <div className="card p-6 flex flex-col justify-between">
          <h2 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
            <RiScales3Line className="text-primary-600" /> Brands Market Share
          </h2>
          {brandShare.length > 0 ? (
            <div className="flex items-center justify-between gap-4 flex-1">
              <div className="w-1/2 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandShare}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {brandShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} items sold`, 'Sales Volume']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col gap-1.5 justify-center pr-2">
                {brandShare.slice(0, 5).map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-secondary-600">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                      <span className="truncate max-w-[90px]">{entry.name}</span>
                    </div>
                    <span className="font-black text-secondary-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="p-12 text-secondary-500 text-xs italic text-center">No brand sales data available yet.</p>
          )}
        </div>
      </div>

      {/* Row 3: Best Selling Products + Low Stock Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="card flex flex-col justify-between">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
              <RiShoppingBagLine className="text-primary-600" /> Best Selling Products
            </h2>
          </div>
          <div className="p-2 divide-y divide-secondary-100 flex-1">
            {bestSellers.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-secondary-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={item.image || '/placeholder-device.png'} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="font-bold text-secondary-900 text-xs line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-secondary-500 font-semibold">{item.soldCount} Units Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-secondary-900 text-xs">{formatPrice(item.revenue)}</p>
                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Revenue</p>
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && <p className="p-12 text-secondary-500 text-xs italic text-center">No sales records yet.</p>}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card flex flex-col justify-between">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
              <RiAlertLine size={18} className="text-amber-500" /> Low Stock Alert
            </h2>
          </div>
          <div className="divide-y divide-secondary-100 flex-1">
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
            {lowStockProducts.length === 0 && <p className="p-12 text-secondary-500 text-xs italic text-center">All products well stocked! ✓</p>}
          </div>
        </div>
      </div>

      {/* Row 4: Quick Actions Hub + Real-Time Activity Log */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions Hub */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-secondary-900 mb-1 flex items-center gap-2">
              <RiSparklingFill className="text-primary-600" /> Quick Operations Hub
            </h2>
            <p className="text-xs text-secondary-400 font-medium mb-4">Instant shortcuts to manage items and configurations</p>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 justify-center items-center">
            <Link to="/admin/products" className="flex items-center gap-3 p-3.5 bg-primary-50/50 hover:bg-primary-600 hover:text-white rounded-2xl transition-all duration-300 border border-primary-100/30 group">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors">
                <RiAddLine size={18} />
              </div>
              <span className="text-xs font-bold transition-colors">Add Product</span>
            </Link>
            <Link to="/admin/coupons" className="flex items-center gap-3 p-3.5 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all duration-300 border border-emerald-100/30 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                <RiPercentLine size={18} />
              </div>
              <span className="text-xs font-bold transition-colors">Create Coupon</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 p-3.5 bg-purple-50/50 hover:bg-purple-600 hover:text-white rounded-2xl transition-all duration-300 border border-purple-100/30 group">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                <RiShoppingBagLine size={18} />
              </div>
              <span className="text-xs font-bold transition-colors">View Orders</span>
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 p-3.5 bg-amber-50/50 hover:bg-amber-600 hover:text-white rounded-2xl transition-all duration-300 border border-amber-100/30 group">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center group-hover:bg-white group-hover:text-amber-600 transition-colors">
                <RiSettings3Line size={18} />
              </div>
              <span className="text-xs font-bold transition-colors">Site Settings</span>
            </Link>
          </div>
        </div>

        {/* Real-Time Activity Log */}
        <div className="card flex flex-col justify-between">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
              <RiHistoryLine className="text-primary-600" /> Recent Activities
            </h2>
          </div>
          <div className="p-5 space-y-4 max-h-[310px] overflow-y-auto scrollbar-none flex-1">
            {activities.map((act, i) => {
              const isLast = i === activities.length - 1;
              const badgeColor = act.type === 'order'
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : act.type === 'review'
                ? 'bg-amber-50 text-amber-650 border-amber-100'
                : 'bg-purple-50 text-purple-600 border-purple-100';
              return (
                <div key={act.id} className="relative flex gap-3">
                  {!isLast && <span className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-secondary-100" />}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs shrink-0 ${badgeColor}`}>
                    {act.type === 'order' ? <RiShoppingCartLine size={12} /> : act.type === 'review' ? <RiStarLine size={12} /> : <RiUserAddLine size={12} />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs font-bold text-secondary-800 leading-snug">{act.text}</p>
                    <p className="text-[10px] text-secondary-400 font-semibold mt-0.5">
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && <p className="text-secondary-500 text-xs italic text-center py-8">No recent activity logs available.</p>}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Orders Table */}
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
    </div>
  );
}
