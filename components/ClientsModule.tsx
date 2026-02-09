import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Trash2, User, Phone, FileText, Filter } from 'lucide-react';
import { ModuleType } from '../types';

export const ClientsModule = () => {
  const { clients, deleteClient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<'ALL' | ModuleType>('ALL');

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);
      
      const matchesModule = moduleFilter === 'ALL' || client.module === moduleFilter;

      return matchesSearch && matchesModule;
    });
  }, [clients, searchTerm, moduleFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${name}" ؟\nتحذير: هذا قد يؤدي إلى حذف السجلات المرتبطة به.`)) {
      await deleteClient(id);
    }
  };

  const getModuleLabel = (module: ModuleType) => {
    switch(module) {
      case ModuleType.SALON: return { text: 'صالون', color: 'bg-pink-100 text-pink-700' };
      case ModuleType.DRESSES: return { text: 'فساتين', color: 'bg-indigo-100 text-indigo-700' };
      case ModuleType.NGAFA: return { text: 'تنكاف', color: 'bg-amber-100 text-amber-700' };
      default: return { text: 'عام', color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <User className="ml-2 text-blue-500" /> إدارة العملاء
          </h2>
          <p className="text-sm text-slate-500">عرض وحذف سجلات العملاء</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الهاتف..." 
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse w-full md:w-auto">
             <Filter className="w-4 h-4 text-slate-400 ml-2" />
             <select 
               className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
               value={moduleFilter}
               onChange={(e) => setModuleFilter(e.target.value as any)}
             >
               <option value="ALL">كل الأقسام</option>
               <option value={ModuleType.SALON}>صالون</option>
               <option value={ModuleType.DRESSES}>فساتين</option>
               <option value={ModuleType.NGAFA}>تنكاف</option>
             </select>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase">
              <tr>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الهاتف / CIN</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">التسجيل</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length > 0 ? (
                filteredClients.map(client => {
                  const badge = getModuleLabel(client.module);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 ml-3">
                           <User size={16} />
                        </div>
                        <div>
                          <div className="font-bold">{client.firstName} {client.lastName}</div>
                          {client.notes && <div className="text-xs text-slate-400 truncate max-w-[150px]">{client.notes}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                         <div className="flex items-center"><Phone size={12} className="ml-1 opacity-50"/> {client.phone}</div>
                         {client.cin && <div className="flex items-center mt-1 text-xs"><FileText size={12} className="ml-1 opacity-50"/> CIN: {client.cin}</div>}
                         {client.ice && <div className="flex items-center mt-1 text-xs text-blue-600"><FileText size={12} className="ml-1 opacity-50"/> ICE: {client.ice}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button 
                          onClick={() => handleDelete(client.id, `${client.firstName} ${client.lastName}`)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف العميل"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    لا يوجد عملاء مطابقين للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
