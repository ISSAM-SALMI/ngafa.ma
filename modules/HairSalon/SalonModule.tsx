import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleType, SalonService, SalonVisit, Client } from '../../types';
import { 
  Scissors, Search, UserPlus, Calendar, Plus, Trash2, Edit2, 
  Save, X, Check, Clock, Printer, CreditCard, ChevronLeft, User, LayoutGrid, Users 
} from 'lucide-react';
import { printReceipt } from '../../utils/printReceipt';

export const SalonModule = () => {
  const { 
    clients, services, visits, 
    addClient, deleteClient, addVisit, 
    addService, updateService, deleteService 
  } = useApp();

  // Tabs: RECEPTION (New Visit), CLIENTS (List & History), SERVICES (Config)
  const [activeTab, setActiveTab] = useState<'RECEPTION' | 'CLIENTS' | 'SERVICES'>('RECEPTION');
  
  // Client Detail View State (Takes precedence over list if set)
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);

  // --- RECEPTION STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  
  // New Client Form inside Reception
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phone: '' });

  // --- SERVICE MANAGEMENT STATE ---
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '' });

  // --- COMPUTED DATA ---
  const salonClients = useMemo(() => 
    clients.filter(c => c.module === ModuleType.SALON), 
  [clients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return salonClients;
    const lower = searchTerm.toLowerCase();
    return salonClients.filter(c => 
      c.firstName.toLowerCase().includes(lower) || 
      c.lastName.toLowerCase().includes(lower) ||
      c.phone.includes(searchTerm)
    );
  }, [salonClients, searchTerm]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId),
  [clients, selectedClientId]);

  // CRITICAL: Ensure price calculation is always numeric
  const currentTotal = useMemo(() => {
    return services
      .filter(s => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + Number(s.price), 0);
  }, [selectedServices, services]);

  const viewingClient = useMemo(() => 
    clients.find(c => c.id === viewingClientId),
  [clients, viewingClientId]);

  // --- METHODS ---

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addClient({
      id: crypto.randomUUID(),
      ...newClient,
      module: ModuleType.SALON,
      createdAt: new Date().toISOString()
    });
    
    if (created) {
      setSelectedClientId(created.id);
      setIsCreatingClient(false);
      setNewClient({ firstName: '', lastName: '', phone: '' });
      setSearchTerm(''); 
    }
  };

  const handleCreateVisit = async () => {
    if (!selectedClientId || selectedServices.length === 0) return;

    const servicesObjs = services.filter(s => selectedServices.includes(s.id));
    
    const newVisit: SalonVisit = {
       id: crypto.randomUUID(),
       clientId: selectedClientId,
       date: visitDate,
       services: servicesObjs,
       totalAmount: currentTotal,
       status: 'COMPLETED'
    };

    await addVisit(newVisit);

    // Success flow: Redirect to Client Details to print receipt
    setViewingClientId(selectedClientId);
    setActiveTab('CLIENTS');
    
    // Reset Reception
    setSelectedServices([]);
    setSelectedClientId(null);
    setSearchTerm('');
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(serviceForm.price);
    if (!serviceForm.name || isNaN(priceNum)) return;

    if (editingService) {
      await updateService({ ...editingService, name: serviceForm.name, price: priceNum });
      setEditingService(null);
    } else {
      await addService({
        id: crypto.randomUUID(),
        name: serviceForm.name,
        price: priceNum
      });
    }
    setServiceForm({ name: '', price: '' });
  };

  const handleEditService = (s: SalonService) => {
    setEditingService(s);
    setServiceForm({ name: s.name, price: s.price.toString() });
  };

  const handlePrintVisit = (visit: SalonVisit) => {
    if (!viewingClient) return;
    printReceipt({
      title: 'إيصال خدمة صالون',
      id: visit.id,
      date: visit.date,
      client: viewingClient,
      total: visit.totalAmount, // Already a number now
      items: visit.services.map(s => ({ name: s.name, price: Number(s.price) }))
    });
  };

  // --- RENDER ---

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Scissors className="ml-2 text-pink-500" /> صالون الحلاقة
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button 
             onClick={() => { setActiveTab('RECEPTION'); setViewingClientId(null); }}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'RECEPTION' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-pink-500'}`}
           >
             استقبال جديد
           </button>
           <button 
             onClick={() => { setActiveTab('CLIENTS'); setViewingClientId(null); }}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'CLIENTS' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-pink-500'}`}
           >
             العملاء والسجل
           </button>
           <button 
             onClick={() => { setActiveTab('SERVICES'); setViewingClientId(null); }}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'SERVICES' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
           >
             الخدمات
           </button>
        </div>
      </div>

      {/* --- TAB: RECEPTION --- */}
      {activeTab === 'RECEPTION' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
           {/* Step 1: Client Selection */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex justify-between items-center">
                 <span>1. اختيار العميل</span>
                 <button 
                    onClick={() => setIsCreatingClient(!isCreatingClient)}
                    className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded"
                 >
                   {isCreatingClient ? 'إلغاء' : 'عميل جديد +'}
                 </button>
               </div>
               
               <div className="p-4 flex-1 overflow-y-auto">
                 {isCreatingClient ? (
                   <form onSubmit={handleCreateClient} className="space-y-3">
                      <input required placeholder="الاسم الأول" className="w-full border p-2 rounded text-sm" value={newClient.firstName} onChange={e => setNewClient({...newClient, firstName: e.target.value})} />
                      <input required placeholder="الاسم العائلي" className="w-full border p-2 rounded text-sm" value={newClient.lastName} onChange={e => setNewClient({...newClient, lastName: e.target.value})} />
                      <input required placeholder="الهاتف" className="w-full border p-2 rounded text-sm" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                      <button className="w-full bg-slate-800 text-white py-2 rounded text-sm">حفظ واختيار</button>
                   </form>
                 ) : (
                   <>
                     <div className="relative mb-4">
                       <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                       <input 
                         autoFocus
                         type="text" 
                         placeholder="بحث بالاسم أو الهاتف..." 
                         className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-pink-500"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                       />
                     </div>
                     <div className="space-y-1">
                       {filteredClients.map(client => (
                         <div 
                           key={client.id}
                           onClick={() => setSelectedClientId(client.id)}
                           className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedClientId === client.id ? 'bg-pink-50 border border-pink-200' : 'hover:bg-slate-50 border border-transparent'}`}
                         >
                            <div>
                              <p className={`font-medium text-sm ${selectedClientId === client.id ? 'text-pink-700' : 'text-slate-800'}`}>{client.firstName} {client.lastName}</p>
                              <p className="text-xs text-slate-500">{client.phone}</p>
                            </div>
                            {selectedClientId === client.id && <Check className="w-4 h-4 text-pink-600" />}
                         </div>
                       ))}
                       {filteredClients.length === 0 && (
                         <p className="text-center text-slate-400 text-sm py-8">لا توجد نتائج</p>
                       )}
                     </div>
                   </>
                 )}
               </div>
           </div>

           {/* Step 2: Service Selection */}
           <div className={`bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden transition-opacity ${!selectedClientId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
                  2. اختيار الخدمات
                </div>
                <div className="p-2 flex-1 overflow-y-auto">
                   <div className="grid grid-cols-1 gap-2">
                     {services.map(service => (
                       <div 
                         key={service.id}
                         onClick={() => toggleService(service.id)}
                         className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${
                           selectedServices.includes(service.id) ? 'bg-pink-50 border-pink-500 shadow-sm' : 'border-slate-100 hover:border-pink-200'
                         }`}
                       >
                          <span className="text-sm font-medium text-slate-800">{service.name}</span>
                          <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded text-slate-600">{Number(service.price).toFixed(2)} درهم</span>
                       </div>
                     ))}
                   </div>
                </div>
           </div>

           {/* Step 3: Summary */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 mb-6">ملخص الزيارة</h3>
                
                {selectedClient && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                     <p className="text-xs text-slate-500 mb-1">العميل</p>
                     <p className="font-bold text-slate-800">{selectedClient.firstName} {selectedClient.lastName}</p>
                     <p className="text-sm text-slate-500">{selectedClient.phone}</p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-500 mb-2">تاريخ الزيارة</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                </div>

                <div className="space-y-2 mb-6">
                   <p className="text-xs font-medium text-slate-500 mb-2">الخدمات المختارة ({selectedServices.length})</p>
                   {services.filter(s => selectedServices.includes(s.id)).map(s => (
                     <div key={s.id} className="flex justify-between text-sm">
                        <span>{s.name}</span>
                        <span>{Number(s.price).toFixed(2)}</span>
                     </div>
                   ))}
                   <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold text-lg text-pink-600">
                      <span>المجموع</span>
                      <span>{currentTotal.toFixed(2)} درهم</span>
                   </div>
                </div>
              </div>

              <button 
                onClick={handleCreateVisit}
                disabled={!selectedClientId || selectedServices.length === 0}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                تأكيد وطباعة
              </button>
           </div>
        </div>
      )}

      {/* --- TAB: CLIENTS & DETAILS --- */}
      {activeTab === 'CLIENTS' && (
        viewingClient ? (
          // CLIENT DETAILS VIEW
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
             <div className="space-y-6">
                <button onClick={() => setViewingClientId(null)} className="flex items-center text-slate-500 hover:text-slate-800 mb-2">
                  <ChevronLeft className="w-4 h-4 ml-1" /> العودة للقائمة
                </button>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                   <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 text-3xl font-bold mb-4 mx-auto">
                      {viewingClient.firstName.charAt(0)}
                   </div>
                   <h2 className="text-xl font-bold text-center text-slate-800">{viewingClient.firstName} {viewingClient.lastName}</h2>
                   <p className="text-center text-slate-500 text-sm mt-1">{viewingClient.phone}</p>
                   
                   <div className="mt-8 border-t pt-4 space-y-3">
                      {(() => {
                         // Recalculate stats cleanly
                         const clientVisits = visits.filter(v => v.clientId === viewingClient.id);
                         const totalSpent = clientVisits.reduce((acc, v) => acc + Number(v.totalAmount), 0);
                         return (
                           <>
                             <div className="flex justify-between">
                               <span className="text-slate-500 text-sm">عدد الزيارات</span>
                               <span className="font-bold">{clientVisits.length}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-slate-500 text-sm">إجمالي المصروف</span>
                               <span className="font-bold text-pink-600">{totalSpent.toFixed(2)} درهم</span>
                             </div>
                           </>
                         )
                      })()}
                   </div>
                </div>
             </div>

             <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
                  سجل الزيارات
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-right text-sm">
                     <thead>
                       <tr className="border-b text-slate-500 bg-slate-50/50">
                         <th className="p-4 font-medium">التاريخ</th>
                         <th className="p-4 font-medium">الخدمات تفصيلاً</th>
                         <th className="p-4 font-medium">المبلغ</th>
                         <th className="p-4 font-medium"></th>
                       </tr>
                     </thead>
                     <tbody>
                       {visits
                         .filter(v => v.clientId === viewingClient.id)
                         .sort((a,b) => b.date.localeCompare(a.date))
                         .map(visit => (
                           <tr key={visit.id} className="border-b last:border-0 hover:bg-slate-50">
                              <td className="p-4 align-top whitespace-nowrap">{visit.date}</td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  {visit.services.map((s, i) => (
                                    <div key={i} className="flex items-center text-xs bg-pink-50 text-pink-800 px-2 py-1 rounded w-fit">
                                       <span>{s.name}</span>
                                       <span className="mx-1 opacity-50">|</span>
                                       <span className="font-bold">{Number(s.price).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 align-top font-bold">{Number(visit.totalAmount).toFixed(2)}</td>
                              <td className="p-4 align-top text-left">
                                <button onClick={() => handlePrintVisit(visit)} className="text-indigo-500 hover:text-indigo-700">
                                  <Printer className="w-5 h-5" />
                                </button>
                              </td>
                           </tr>
                         ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        ) : (
          // CLIENTS LIST
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">سجل العملاء</h3>
               <div className="relative w-64">
                  <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input 
                    className="w-full border rounded-lg pl-3 pr-9 py-2 text-sm outline-none focus:ring-2 ring-pink-500/20 border-slate-200" 
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
             </div>
             <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 text-slate-500">
                 <tr>
                   <th className="p-4 font-medium">العميل</th>
                   <th className="p-4 font-medium">الهاتف</th>
                   <th className="p-4 font-medium">آخر نشاط</th>
                   <th className="p-4 font-medium text-left">--</th>
                 </tr>
               </thead>
               <tbody>
                  {filteredClients.map(client => {
                     const lastVisit = visits
                       .filter(v => v.clientId === client.id)
                       .sort((a,b) => b.date.localeCompare(a.date))[0];
                     return (
                       <tr key={client.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setViewingClientId(client.id)}>
                         <td className="p-4 font-medium">{client.firstName} {client.lastName}</td>
                         <td className="p-4 text-slate-500">{client.phone}</td>
                         <td className="p-4 text-slate-500">{lastVisit ? lastVisit.date : '-'}</td>
                         <td className="p-4 text-left flex justify-end gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingClientId(client.id);
                              }}
                              className="text-pink-500 hover:text-pink-700"
                              title="عرض التفاصيل"
                            >
                              <User className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع الزيارات المرتبطة به.')) {
                                  deleteClient(client.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="حذف العميل"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                         </td>
                       </tr>
                     )
                  })}
               </tbody>
             </table>
          </div>
        )
      )}

      {/* --- TAB: SERVICES CONFIG --- */}
      {activeTab === 'SERVICES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
              <h3 className="font-bold text-slate-800 mb-4">{editingService ? 'تعديل خدمة' : 'إضافة خدمة جديدة'}</h3>
              <form onSubmit={handleSaveService} className="space-y-4">
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">الاسم</label>
                   <input required className="w-full border rounded-lg p-2 text-sm" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">السعر</label>
                   <input required type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} />
                 </div>
                 <div className="flex gap-2">
                    {editingService && (
                      <button type="button" onClick={() => { setEditingService(null); setServiceForm({name:'', price:''}); }} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm">إلغاء</button>
                    )}
                    <button className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm font-medium">حفظ</button>
                 </div>
              </form>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">الخدمة</th>
                    <th className="p-3">السعر</th>
                    <th className="p-3 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3">{Number(s.price).toFixed(2)}</td>
                      <td className="p-3 text-left flex justify-end gap-2">
                         <button onClick={() => handleEditService(s)} className="text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={() => deleteService(s.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};
