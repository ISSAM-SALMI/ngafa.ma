import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ModuleType, DressStatus } from '../types';
import { DollarSign, Scissors, Shirt, Package, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => {
  // Safe color mapping for Tailwind
  const getColorClasses = (cls: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      'bg-emerald-500': { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      'bg-blue-500': { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      'bg-indigo-500': { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
      'bg-pink-500': { bg: 'bg-pink-500/10', text: 'text-pink-500' },
    };
    return colorMap[cls] || { bg: 'bg-slate-100', text: 'text-slate-500' };
  };

  const { bg, text } = getColorClasses(color);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 space-x-reverse">
      <div className={`p-4 rounded-full ${bg} ${text} ml-4`}>
        <Icon className={`w-8 h-8 ${text}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { clients, visits, rentals, ngafaEvents, dresses, ngafaItems } = useApp();

  // Calculations
  const totalRevenue = 
    visits.reduce((acc, v) => acc + v.totalAmount, 0) + 
    rentals.reduce((acc, r) => acc + r.totalPrice, 0) +
    ngafaEvents.reduce((acc, e) => acc + (e.totalPrice || 0), 0);

  const clientsByModule = [
    { name: 'صالون', value: clients.filter(c => c.module === ModuleType.SALON).length, color: '#ec4899' },
    { name: 'فساتين', value: clients.filter(c => c.module === ModuleType.DRESSES).length, color: '#8b5cf6' },
    { name: 'نكافة', value: clients.filter(c => c.module === ModuleType.NGAFA).length, color: '#f59e0b' },
  ];

  const revenueByModule = [
    { 
      name: 'صالون', 
      revenue: visits.reduce((acc, v) => acc + v.totalAmount, 0) 
    },
    { 
      name: 'فساتين', 
      revenue: rentals.reduce((acc, r) => acc + r.totalPrice, 0) 
    },
    { 
      name: 'نكافة', 
      revenue: ngafaEvents.reduce((acc, e) => acc + (e.totalPrice || 0), 0) 
    },
  ];

  const availableDresses = dresses.filter(d => d.status === DressStatus.AVAILABLE).length;
  const totalDresses = dresses.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الإيرادات" 
          value={`${totalRevenue.toLocaleString()} درهم`} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="إجمالي العملاء" 
          value={clients.length} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="فساتين متاحة" 
          value={`${availableDresses} / ${totalDresses}`} 
          icon={Shirt} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="خدمات الصالون" 
          value={visits.length} 
          icon={Scissors} 
          color="bg-pink-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 mb-4">الإيرادات حسب النشاط</h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByModule}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${value} درهم`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clients Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 mb-4">توزيع العملاء</h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientsByModule}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {clientsByModule.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 space-x-reverse mt-4">
            {clientsByModule.map((item) => (
              <div key={item.name} className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: item.color }}></div>
                {item.name} ({item.value})
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick History Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">الأنشطة الأخيرة</h3>
        <div className="space-y-4">
          {visits.slice(-3).reverse().map(visit => {
            const client = clients.find(c => c.id === visit.clientId);
            return (
              <div key={visit.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-pink-100 p-2 rounded-lg text-pink-600 ml-3"><Scissors size={18} /></div>
                  <div>
                    <p className="font-medium text-slate-900">{client ? `${client.firstName} ${client.lastName}` : 'عميل غير معروف'}</p>
                    <p className="text-xs text-slate-500">صالون • {visit.date}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-700">{visit.totalAmount} درهم</span>
              </div>
            );
          })}
           {rentals.slice(-3).reverse().map(rental => {
            const client = clients.find(c => c.id === rental.clientId);
            return (
              <div key={rental.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 ml-3"><Shirt size={18} /></div>
                  <div>
                    <p className="font-medium text-slate-900">{client ? `${client.firstName} ${client.lastName}` : 'عميل غير معروف'}</p>
                    <p className="text-xs text-slate-500">تأجير • {rental.startDate}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-700">{rental.totalPrice} درهم</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};