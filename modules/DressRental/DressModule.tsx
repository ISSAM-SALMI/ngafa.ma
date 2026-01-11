import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleType, DressStatus, DressRental, Dress } from '../../types';
import { Shirt, Search, Calendar, CheckCircle, XCircle, Settings, Edit2, Trash2, Save, X, Plus, Printer } from 'lucide-react';
import { printReceipt } from '../../utils/printReceipt';

export const DressModule = () => {
  const { 
    clients, dresses, rentals, 
    addClient, addRental, 
    addDress, updateDress, deleteDress 
  } = useApp();
  
  const [view, setView] = useState<'INVENTORY' | 'NEW_RENTAL' | 'SETTINGS'>('INVENTORY');

  // New Client
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phone: '', cin: '' });
  
  // New Rental
  const [rentalData, setRentalData] = useState({
    clientId: '',
    dressId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // --- Dress Management State ---
  const [dressForm, setDressForm] = useState<{
    id?: string, 
    name: string, 
    reference: string, 
    size: string, 
    color: string, 
    pricePerDay: string,
    status: DressStatus
  }>({
    name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE
  });
  const [isEditingDress, setIsEditingDress] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const dressClients = clients.filter(c => c.module === ModuleType.DRESSES);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addClient({
      id: crypto.randomUUID(),
      ...newClient,
      module: ModuleType.DRESSES,
      createdAt: new Date().toISOString()
    });

    if (created) {
      setRentalData(prev => ({ ...prev, clientId: created.id }));
    }

    setNewClient({ firstName: '', lastName: '', phone: '', cin: '' });
  };

  const isDressAvailable = (dressId: string, start: string, end: string) => {
     // Simple overlap check
     const s = new Date(start).getTime();
     const e = new Date(end).getTime();
     if(isNaN(s) || isNaN(e)) return true; // Invalid dates

     return !rentals.some(r => {
        if (r.dressId !== dressId || r.status !== 'ACTIVE') return false;
        const rStart = new Date(r.startDate).getTime();
        const rEnd = new Date(r.endDate).getTime();
        return (s <= rEnd && e >= rStart);
     });
  };

  const handleRent = async () => {
    let finalClientId = rentalData.clientId;

    // Handle implicit new client creation if form filled but not saved
    if (!finalClientId && newClient.firstName && newClient.lastName) {
       const created = await addClient({
          id: crypto.randomUUID(),
          ...newClient,
          module: ModuleType.DRESSES,
          createdAt: new Date().toISOString()
       });
       if (created) {
         finalClientId = created.id;
         // Clear form
         setNewClient({ firstName: '', lastName: '', phone: '', cin: '' });
         // Update selection in case we stay on this view
         setRentalData(prev => ({ ...prev, clientId: created.id }));
       }
    }

    if (!finalClientId || !rentalData.dressId || !rentalData.startDate || !rentalData.endDate) return;
    
    const dress = dresses.find(d => d.id === rentalData.dressId);
    if (!dress) return;

    // Calculate duration
    const start = new Date(rentalData.startDate);
    const end = new Date(rentalData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 

    const newRental: DressRental = {
      id: crypto.randomUUID(),
      clientId: finalClientId,
      dressId: rentalData.dressId,
      startDate: rentalData.startDate,
      endDate: rentalData.endDate,
      totalPrice: dress.pricePerDay * diffDays,
      status: 'ACTIVE'
    };

    addRental(newRental);
    // Keep in same view but reset data to allow printing from list below
    setRentalData({ ...rentalData, dressId: '', endDate: '' });
  };

  const handlePrintRental = (rental: DressRental) => {
     const client = clients.find(c => c.id === rental.clientId);
     const dress = dresses.find(d => d.id === rental.dressId);
     if (!client || !dress) return;

     printReceipt({
       title: 'عقد كراء فستان',
       id: rental.id,
       date: new Date().toISOString().split('T')[0],
       client: client,
       total: rental.totalPrice,
       items: [{ name: `${dress.name} (${dress.reference})`, price: rental.totalPrice }],
       footerNote: `من ${rental.startDate} إلى ${rental.endDate}. يرجى إعادة الفستان في حالة جيدة.`
     });
  };

  // --- CRUD HANDLERS FOR DRESSES ---
  const handleSaveDress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dressForm.name || !dressForm.reference || !dressForm.pricePerDay) return;

    const price = parseFloat(dressForm.pricePerDay);
    
    if (isEditingDress && dressForm.id) {
      await updateDress({
        id: dressForm.id,
        name: dressForm.name,
        reference: dressForm.reference,
        size: dressForm.size,
        color: dressForm.color,
        pricePerDay: price,
        status: dressForm.status
      }, selectedFile || undefined);
      setIsEditingDress(false);
    } else {
      await addDress({
        id: crypto.randomUUID(),
        name: dressForm.name,
        reference: dressForm.reference,
        size: dressForm.size,
        color: dressForm.color,
        pricePerDay: price,
        status: dressForm.status
      }, selectedFile || undefined);
    }
    setDressForm({ name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE });
    setSelectedFile(null);
  };

  const handleEditDressClick = (dress: Dress) => {
    setDressForm({ 
      id: dress.id, 
      name: dress.name, 
      reference: dress.reference,
      size: dress.size, 
      color: dress.color,
      pricePerDay: dress.pricePerDay.toString(),
      status: dress.status
    });
    setIsEditingDress(true);
    // Scroll to form if needed
  };

  const handleCancelEdit = () => {
    setIsEditingDress(false);
    setDressForm({ name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Shirt className="ml-2 text-indigo-500" /> تأجير الفساتين
          </h2>
          <p className="text-sm text-slate-500">إدارة المخزون وتأجير الفساتين</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
            <button 
              onClick={() => setView('SETTINGS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${view === 'SETTINGS' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4 ml-2" />
              الإعدادات
            </button>
            <button 
              onClick={() => setView('INVENTORY')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'INVENTORY' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              المخزون
            </button>
            <button 
              onClick={() => setView('NEW_RENTAL')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              تأجير جديد
            </button>
        </div>
      </div>

      {/* --- VIEW: SETTINGS (CRUD) --- */}
      {view === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Dress List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-semibold text-slate-700">قائمة الفساتين</h3>
               <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                 إجمالي: {dresses.length}
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-right">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-6 py-3">الصورة / الاسم</th>
                      <th className="px-6 py-3">المرجع</th>
                      <th className="px-6 py-3">المقاس</th>
                      <th className="px-6 py-3">السعر/يوم</th>
                      <th className="px-6 py-3">الحالة</th>
                      <th className="px-6 py-3 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dresses.map(dress => (
                      <tr key={dress.id} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center space-x-3 space-x-reverse">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center ml-2 overflow-hidden">
                             {dress.image ? <img src={dress.image} className="w-full h-full object-cover"/> : <Shirt size={16} className="text-slate-400" />}
                          </div>
                          <span>{dress.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{dress.reference}</td>
                        <td className="px-6 py-4 text-slate-700">{dress.size}</td>
                        <td className="px-6 py-4 text-indigo-600 font-bold">{dress.pricePerDay}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            dress.status === DressStatus.AVAILABLE ? 'bg-green-100 text-green-700' :
                            dress.status === DressStatus.RENTED ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {dress.status === DressStatus.AVAILABLE ? 'متاح' : dress.status === DressStatus.RENTED ? 'مؤجر' : 'صيانة'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left flex justify-end space-x-3 space-x-reverse">
                           <button onClick={() => handleEditDressClick(dress)} className="text-indigo-400 hover:text-indigo-600 ml-3">
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => deleteDress(dress.id)} className="text-red-400 hover:text-red-600">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>

          {/* Add/Edit Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-semibold text-slate-700 mb-4">
              {isEditingDress ? 'تعديل الفستان' : 'إضافة فستان جديد'}
            </h3>
            <form onSubmit={handleSaveDress} className="space-y-4">
               
               <div className="flex flex-col md:flex-row gap-6">
                 
                 {/* Image Upload Section - Side */}
                 <div className="w-full md:w-1/3 order-1 md:order-2">
                    <label className="block text-xs font-medium text-slate-500 mb-2">صورة الفستان</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group h-48">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                  setSelectedFile(e.target.files[0]);
                              }
                          }}
                        />
                        {(selectedFile || (isEditingDress && dressForm.id && dresses.find(d => d.id === dressForm.id)?.image)) ? (
                            <img 
                              src={selectedFile ? URL.createObjectURL(selectedFile) : dresses.find(d => d.id === dressForm.id)?.image} 
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-lg" 
                            />
                        ) : (
                            <div className="text-center">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                  <Shirt className="w-5 h-5" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">اضغط لرفع صورة</p>
                                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Form Fields Section */}
                 <div className="flex-1 space-y-4 order-2 md:order-1">
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">اسم الفستان</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="مثال: قفطان ملكي"
                        className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                        value={dressForm.name}
                        onChange={(e) => setDressForm({...dressForm, name: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">المرجع</label>
                        <input 
                          required 
                          type="text" 
                          placeholder="REF-001"
                          className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                          value={dressForm.reference}
                          onChange={(e) => setDressForm({...dressForm, reference: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">السعر / يوم</label>
                        <input 
                          required 
                          type="number" 
                          placeholder="0"
                          className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                          value={dressForm.pricePerDay}
                          onChange={(e) => setDressForm({...dressForm, pricePerDay: e.target.value})}
                        />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">المقاس</label>
                        <input 
                          type="text" 
                          placeholder="38, 40, M, L"
                          className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                          value={dressForm.size}
                          onChange={(e) => setDressForm({...dressForm, size: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">اللون</label>
                        <input 
                          type="text" 
                          placeholder="أبيض, أحمر..."
                          className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                          value={dressForm.color}
                          onChange={(e) => setDressForm({...dressForm, color: e.target.value})}
                        />
                     </div>
                   </div>
                   
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">الحالة</label>
                      <select 
                        className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-indigo-500"
                        value={dressForm.status}
                        onChange={(e) => setDressForm({...dressForm, status: e.target.value as DressStatus})}
                      >
                        <option value={DressStatus.AVAILABLE}>متاح</option>
                        <option value={DressStatus.RENTED}>مؤجر</option>
                        <option value={DressStatus.MAINTENANCE}>في الصيانة</option>
                      </select>
                   </div>
                 </div>
               </div>

               <div className="flex space-x-2 space-x-reverse pt-4 border-t border-slate-50 mt-4">
                 {isEditingDress && (
                   <button 
                    type="button" 
                    onClick={() => {
                      setIsEditingDress(false);
                      setDressForm({ name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE });
                      setSelectedFile(null);
                    }}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex justify-center items-center ml-2"
                   >
                     <X className="w-4 h-4 ml-1" /> إلغاء
                   </button>
                 )}
                 <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex justify-center items-center"
                 >
                   {isEditingDress ? <><Save className="w-4 h-4 ml-2" /> تحديث</> : <><Plus className="w-4 h-4 ml-2" /> إضافة</>}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {view === 'INVENTORY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dresses.map(dress => (
            <div key={dress.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-72 bg-slate-50 flex items-center justify-center relative group">
                 {dress.image ? (
                   <img src={dress.image} alt={dress.name} className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105" />
                 ) : (
                   <Shirt className="w-16 h-16 text-slate-300" />
                 )}
                 <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                   dress.status === DressStatus.AVAILABLE ? 'bg-green-100 text-green-700' : 
                   dress.status === DressStatus.RENTED ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                 }`}>
                   {dress.status === DressStatus.AVAILABLE ? 'متاح' : dress.status === DressStatus.RENTED ? 'مؤجر' : 'صيانة'}
                 </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-slate-800">{dress.name}</h3>
                   <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{dress.reference}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 mb-4">
                  <span>المقاس: {dress.size}</span>
                  <span>اللون: {dress.color}</span>
                </div>
                <div className="mt-auto flex justify-between items-center border-t border-slate-50 pt-3">
                  <span className="font-bold text-indigo-600">{dress.pricePerDay} درهم<span className="text-xs text-slate-400 font-normal">/يوم</span></span>
                  <button onClick={() => { setRentalData({...rentalData, dressId: dress.id}); setView('NEW_RENTAL'); }} className="text-indigo-500 text-sm font-medium hover:underline">استئجار</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'NEW_RENTAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Client Selection / Creation */}
           <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
              <h3 className="font-semibold text-slate-700 mb-4">العميل</h3>
              
              <div className="mb-6">
                 <label className="block text-xs font-medium text-slate-500 mb-1">اختر عميل حالي</label>
                 <select 
                  className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-indigo-500"
                  value={rentalData.clientId}
                  onChange={(e) => setRentalData({...rentalData, clientId: e.target.value})}
                 >
                   <option value="">-- عميل جديد --</option>
                   {dressClients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                 </select>
              </div>

              {!rentalData.clientId && (
                <form onSubmit={handleCreateClient} className="space-y-3 pt-4 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase">إضافة عميل جديد</p>
                  <input required placeholder="الاسم الأول" className="w-full bg-white text-slate-900 border p-2 rounded text-sm placeholder-slate-400" value={newClient.firstName} onChange={e => setNewClient({...newClient, firstName: e.target.value})} />
                  <input required placeholder="الاسم العائلي" className="w-full bg-white text-slate-900 border p-2 rounded text-sm placeholder-slate-400" value={newClient.lastName} onChange={e => setNewClient({...newClient, lastName: e.target.value})} />
                  <input required placeholder="رقم البطاقة (CIN)" className="w-full bg-white text-slate-900 border p-2 rounded text-sm placeholder-slate-400" value={newClient.cin} onChange={e => setNewClient({...newClient, cin: e.target.value})} />
                  <input required placeholder="الهاتف" className="w-full bg-white text-slate-900 border p-2 rounded text-sm placeholder-slate-400" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                  <button className="w-full bg-slate-800 text-white text-sm py-2 rounded hover:bg-slate-700">حفظ</button>
                </form>
              )}
           </div>

           {/* Rental Details */}
           <div className="lg:col-span-2 space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4">تفاصيل الاستئجار</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">الفستان</label>
                      <select 
                        className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-indigo-500"
                        value={rentalData.dressId}
                        onChange={(e) => setRentalData({...rentalData, dressId: e.target.value})}
                      >
                        <option value="">-- اختر فستان --</option>
                        {dresses.map(d => <option key={d.id} value={d.id}>{d.name} ({d.size}) - {d.pricePerDay} درهم</option>)}
                      </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">من</label>
                        <input type="date" className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-2 text-sm text-right" 
                          value={rentalData.startDate} onChange={e => setRentalData({...rentalData, startDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">إلى</label>
                        <input type="date" className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-2 text-sm text-right" 
                          value={rentalData.endDate} onChange={e => setRentalData({...rentalData, endDate: e.target.value})} />
                      </div>
                  </div>
                </div>

                {/* Availability Check UI */}
                {rentalData.dressId && rentalData.endDate && (
                  <div className={`p-4 rounded-lg mb-6 flex items-center ${isDressAvailable(rentalData.dressId, rentalData.startDate, rentalData.endDate) ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {isDressAvailable(rentalData.dressId, rentalData.startDate, rentalData.endDate) ? (
                      <>
                        <CheckCircle className="w-5 h-5 ml-2" />
                        <div>
                          <p className="font-bold text-sm">متاح!</p>
                          <p className="text-xs">هذا الفستان متاح في هذه التواريخ.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 ml-2" />
                        <div>
                          <p className="font-bold text-sm">غير متاح</p>
                          <p className="text-xs">هذا الفستان محجوز في هذه الفترة.</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button 
                    onClick={handleRent}
                    disabled={!isDressAvailable(rentalData.dressId, rentalData.startDate, rentalData.endDate) || (!rentalData.clientId && (!newClient.firstName || !newClient.lastName))}
                    className="bg-indigo-600 disabled:bg-indigo-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    تأكيد الحجز
                  </button>
                </div>
             </div>

             {/* Recent Rentals / Quick Print */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700">عمليات التأجير الأخيرة</h3>
                </div>
                <div className="divide-y divide-slate-100">
                   {rentals.slice(-5).reverse().map(rental => {
                     const client = clients.find(c => c.id === rental.clientId);
                     const dress = dresses.find(d => d.id === rental.dressId);
                     return (
                       <div key={rental.id} className="p-4 flex justify-between items-center">
                         <div>
                            <p className="text-sm font-bold text-slate-800">{client?.firstName} {client?.lastName}</p>
                            <p className="text-xs text-slate-500">{dress?.name} • {rental.startDate}</p>
                         </div>
                         <button 
                           onClick={() => handlePrintRental(rental)}
                           className="text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center"
                         >
                           <Printer className="w-3 h-3 ml-2" /> تحميل PDF
                         </button>
                       </div>
                     );
                   })}
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};