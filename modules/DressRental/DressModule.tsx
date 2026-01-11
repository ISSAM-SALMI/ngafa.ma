import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleType, DressStatus, DressRental, Dress } from '../../types';
import { 
  Shirt, Search, Calendar, CheckCircle, XCircle, 
  Settings, Edit2, Trash2, Save, X, Plus, Printer, 
  History, ArrowLeft, User as UserIcon, Filter, 
  ChevronRight, ArrowRight
} from 'lucide-react';

export const DressModule = () => {
  const { 
    clients, dresses, rentals, 
    addClient, addRental, returnRental,
    addDress, updateDress, deleteDress 
  } = useApp();
  
  // --- View State ---
  const [activeTab, setActiveTab] = useState<'RENTALS' | 'INVENTORY' | 'NEW_RENTAL'>('RENTALS');

  // --- Search/Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RETURNED'>('ALL');

  // --- New Rental State ---
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phone: '', cin: '' });
  const [rentalData, setRentalData] = useState({
    clientId: '',
    dressId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '' // User must select
  });

  // --- Dress Form State ---
  const [isEditingDress, setIsEditingDress] = useState(false);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Derived Data ---
  const dressClients = useMemo(() => clients.filter(c => c.module === ModuleType.DRESSES), [clients]);
  
  const filteredRentals = useMemo(() => {
    return rentals
      .filter(r => {
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const client = clients.find(c => c.id === r.clientId);
        const dress = dresses.find(d => d.id === r.dressId);
        const searchLower = searchTerm.toLowerCase();
        return (
          (client?.firstName.toLowerCase() || '').includes(searchLower) ||
          (client?.lastName.toLowerCase() || '').includes(searchLower) ||
          (dress?.name.toLowerCase() || '').includes(searchLower) ||
          (dress?.reference.toLowerCase() || '').includes(searchLower)
        );
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [rentals, searchTerm, statusFilter, clients, dresses]);

  const filteredDresses = useMemo(() => {
    if (!searchTerm) return dresses;
    const lower = searchTerm.toLowerCase();
    return dresses.filter(d => 
      d.name.toLowerCase().includes(lower) || 
      d.reference.toLowerCase().includes(lower) ||
      d.color.toLowerCase().includes(lower)
    );
  }, [dresses, searchTerm]);

  // --- Helpers ---
  const isDressAvailable = (dressId: string, start: string, end: string) => {
     const s = new Date(start).getTime();
     const e = new Date(end).getTime();
     if(isNaN(s) || isNaN(e)) return true; 

     return !rentals.some(r => {
        if (r.dressId !== dressId || r.status !== 'ACTIVE') return false;
        const rStart = new Date(r.startDate).getTime();
        const rEnd = new Date(r.endDate).getTime();
        return (s <= rEnd && e >= rStart);
     });
  };

  const handleCreateClient = async () => {
    if (!newClient.firstName || !newClient.lastName) return null;
    return await addClient({
      id: crypto.randomUUID(),
      ...newClient,
      module: ModuleType.DRESSES,
      createdAt: new Date().toISOString()
    });
  };

  const handleRent = async () => {
    let finalClientId = rentalData.clientId;

    if (!finalClientId) {
      const created = await handleCreateClient();
      if (created) finalClientId = created.id;
    }

    if (!finalClientId || !rentalData.dressId || !rentalData.startDate || !rentalData.endDate) return;
    
    const dress = dresses.find(d => d.id === rentalData.dressId);
    if (!dress) return;

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

    await addRental(newRental);
    // Reset and go to rentals
    setNewClient({ firstName: '', lastName: '', phone: '', cin: '' });
    setRentalData({ ...rentalData, clientId: '', dressId: '', endDate: '' });
    setActiveTab('RENTALS');
  };

  const handlePrintRental = (rentalId: string) => {
     window.open(`/api/dress-rentals/${rentalId}/contract/`, '_blank');
  };

  const handleSaveDress = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(dressForm.pricePerDay);
    const payload = {
        id: dressForm.id || crypto.randomUUID(),
        name: dressForm.name,
        reference: dressForm.reference,
        size: dressForm.size,
        color: dressForm.color,
        pricePerDay: price,
        status: dressForm.status
    };

    if (isEditingDress && dressForm.id) {
      await updateDress(payload, selectedFile || undefined);
    } else {
      await addDress(payload, selectedFile || undefined);
    }
    closeDressForm();
  };

  const openDressForm = (dress?: Dress) => {
    if (dress) {
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
    } else {
        setDressForm({ name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE });
        setIsEditingDress(false);
    }
    setActiveTab('INVENTORY');
  };

  const closeDressForm = () => {
    setIsEditingDress(false);
    setDressForm({ name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE });
    setSelectedFile(null);
  };

  // --- RENDERERS ---
  
  // 1. Rentals List View
  const renderRentalsView = () => (
    <div className="space-y-4 animate-fade-in">
       {/* Filters */}
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="بحث باسم العميل أو الفستان..." 
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 space-x-reverse w-full sm:w-auto">
             <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600'}`}>الكل</button>
             <button onClick={() => setStatusFilter('ACTIVE')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'ACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-600'}`}>نشط (لم يرجع)</button>
             <button onClick={() => setStatusFilter('RETURNED')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'RETURNED' ? 'bg-green-100 text-green-800' : 'bg-slate-50 text-slate-600'}`}>مكتمل</button>
          </div>
       </div>

       {/* List */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-right">
             <thead className="bg-slate-50 text-slate-500 font-medium">
               <tr>
                 <th className="px-6 py-4">العميل</th>
                 <th className="px-6 py-4">الفستان</th>
                 <th className="px-6 py-4">الفترة</th>
                 <th className="px-6 py-4">إجمالي</th>
                 <th className="px-6 py-4">الحالة</th>
                 <th className="px-6 py-4 text-left">إجراءات</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredRentals.map(rental => {
                 const client = clients.find(c => c.id === rental.clientId);
                 const dress = dresses.find(d => d.id === rental.dressId);
                 const isActive = rental.status === 'ACTIVE';
                 return (
                   <tr key={rental.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 font-medium text-slate-900">
                       {client?.firstName} {client?.lastName}
                       <div className="text-xs text-slate-400 font-normal">{client?.phone}</div>
                     </td>
                     <td className="px-6 py-4 text-slate-700">
                       <div className="flex items-center">
                         {dress?.image && <img src={dress.image} className="w-8 h-8 rounded object-cover ml-2" />}
                         <span>{dress?.name}</span>
                       </div>
                       <span className="text-xs text-slate-400">{dress?.reference}</span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">
                       <div className="flex items-center"><Calendar size={12} className="ml-1"/> {rental.startDate}</div>
                       <div className="flex items-center mt-1"><ArrowLeft size={12} className="ml-1 text-slate-300"/> {rental.endDate}</div>
                     </td>
                     <td className="px-6 py-4 font-bold text-indigo-600">{rental.totalPrice} درهم</td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                         isActive ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                       }`}>
                         {isActive ? 'نشط' : 'تم الإرجاع'}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center justify-end space-x-2 space-x-reverse">
                         <button 
                           onClick={() => handlePrintRental(rental.id)}
                           className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                           title="طباعة العقد"
                         >
                           <Printer size={18} />
                         </button>
                         {isActive && (
                           <button 
                             onClick={() => returnRental(rental.id)}
                             className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors"
                           >
                             إرجاع
                           </button>
                         )}
                       </div>
                     </td>
                   </tr>
                 );
               })}
               {filteredRentals.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                     لا توجد عمليات تأجير مطابقة
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
       </div>
    </div>
  );

  // 2. Inventory View (Combined Grid + Form Modal)
  const renderInventoryView = () => (
    <div className="space-y-6 animate-fade-in">
       {/* Toolbar */}
       <div className="flex justify-between items-center">
         <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="بحث عن فستان..." 
              className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <button 
           onClick={() => { setIsEditingDress(false); setDressForm({ name: '', reference: '', size: '', color: '', pricePerDay: '', status: DressStatus.AVAILABLE }); }}
           className="hidden" // Hidden logic trigger
         />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Add New Card Button */}
           <div 
             onClick={() => openDressForm()}
             className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-500 min-h-[300px]"
           >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Plus size={24} />
              </div>
              <span className="font-medium">إضافة فستان جديد</span>
           </div>

           {/* Dress Cards */}
           {filteredDresses.map(dress => (
             <div key={dress.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                <div className="h-48 bg-slate-50 relative overflow-hidden">
                   {dress.image ? (
                     <img src={dress.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300">
                       <Shirt size={48} />
                     </div>
                   )}
                   <div className="absolute top-2 right-2">
                     <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${
                        dress.status === DressStatus.AVAILABLE ? 'bg-white/90 text-green-700' : 
                        dress.status === DressStatus.RENTED ? 'bg-white/90 text-amber-700' : 'bg-white/90 text-red-700'
                     }`}>
                       {dress.status === DressStatus.AVAILABLE ? 'متاح' : dress.status === DressStatus.RENTED ? 'مؤجر' : 'صيانة'}
                     </span>
                   </div>
                   {/* Overlay Actions */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 space-x-reverse">
                      <button onClick={() => openDressForm(dress)} className="p-2 bg-white rounded-full text-slate-800 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => deleteDress(dress.id)} className="p-2 bg-white rounded-full text-slate-800 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                   </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 truncate" title={dress.name}>{dress.name}</h3>
                   </div>
                   <p className="text-xs text-slate-500 mb-3 bg-slate-50 w-fit px-2 py-1 rounded">REF: {dress.reference}</p>
                   
                   <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 mt-auto">
                     <div><span className="opacity-75">المقاس:</span> <span className="font-medium text-slate-700">{dress.size}</span></div>
                     <div><span className="opacity-75">اللون:</span> <span className="font-medium text-slate-700">{dress.color}</span></div>
                   </div>
                   
                   <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                      <span className="font-bold text-indigo-600 text-lg">{dress.pricePerDay} <span className="text-xs font-normal text-slate-400">درهم</span></span>
                   </div>
                </div>
             </div>
           ))}
       </div>

       {/* Modal for Add/Edit Dress (Simple Overlay) */}
       {(isEditingDress || dressForm.name || dressForm.status !== DressStatus.AVAILABLE && !dressForm.id) && (
           <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                 <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">{isEditingDress ? 'تعديل الفستان' : 'إضافة فستان جديد'}</h3>
                    <button onClick={closeDressForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                 </div>
                 <form onSubmit={handleSaveDress} className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                       <div className="w-full md:w-1/3">
                          <label className="block text-xs font-medium text-slate-500 mb-2">صورة الفستان</label>
                          <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 relative flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden">
                             <input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                                }}
                             />
                             {(selectedFile || (dressForm.id && dresses.find(d => d.id === dressForm.id)?.image)) ? (
                               <img 
                                 src={selectedFile ? URL.createObjectURL(selectedFile) : dresses.find(d => d.id === dressForm.id)?.image} 
                                 className="w-full h-full object-cover"
                               />
                             ) : (
                               <div className="text-center p-4">
                                  <Shirt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <span className="text-xs text-slate-400">اضغط لرفع صورة</span>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                               <label className="text-xs font-medium text-slate-500">اسم الفستان</label>
                               <input required value={dressForm.name} onChange={e => setDressForm({...dressForm, name: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm" placeholder="مثال: قفطان ملكي" />
                             </div>
                             <div>
                               <label className="text-xs font-medium text-slate-500">المرجع</label>
                               <input required value={dressForm.reference} onChange={e => setDressForm({...dressForm, reference: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm" placeholder="REF-001" />
                             </div>
                             <div>
                               <label className="text-xs font-medium text-slate-500">السعر (درهم/يوم)</label>
                               <input required type="number" value={dressForm.pricePerDay} onChange={e => setDressForm({...dressForm, pricePerDay: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm" placeholder="0" />
                             </div>
                             <div>
                               <label className="text-xs font-medium text-slate-500">المقاس</label>
                               <input value={dressForm.size} onChange={e => setDressForm({...dressForm, size: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm" placeholder="38, 40..." />
                             </div>
                             <div>
                               <label className="text-xs font-medium text-slate-500">اللون</label>
                               <input value={dressForm.color} onChange={e => setDressForm({...dressForm, color: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm" placeholder="أبيض..." />
                             </div>
                             <div className="col-span-2">
                               <label className="text-xs font-medium text-slate-500">الحالة</label>
                               <select value={dressForm.status} onChange={e => setDressForm({...dressForm, status: e.target.value as DressStatus})} className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm">
                                  <option value={DressStatus.AVAILABLE}>متاح</option>
                                  <option value={DressStatus.RENTED}>مؤجر</option>
                                  <option value={DressStatus.MAINTENANCE}>صيانة</option>
                               </select>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                       <button type="button" onClick={closeDressForm} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors">إلغاء</button>
                       <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">حفظ الفستان</button>
                    </div>
                 </form>
              </div>
           </div>
       )}
    </div>
  );

  // 3. New Rental Flow
  const renderNewRental = () => {
     const selectedRefDress = dresses.find(d => d.id === rentalData.dressId);
     const isAvailable = rentalData.dressId && rentalData.endDate ? isDressAvailable(rentalData.dressId, rentalData.startDate, rentalData.endDate) : null;

     return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-2 space-y-6">
             {/* 1. Client Selection */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold ml-3">1</div>
                   <h3 className="font-bold text-slate-800">بيانات العميل</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2">
                     <label className="block text-xs font-medium text-slate-500 mb-1">بحث عن عميل مسجل</label>
                     <select 
                        value={rentalData.clientId} 
                        onChange={e => setRentalData({...rentalData, clientId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
                     >
                        <option value="">-- عميل جديد --</option>
                        {dressClients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone})</option>)}
                     </select>
                   </div>
                   
                   {!rentalData.clientId && (
                      <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
                          <input placeholder="الاسم الأول" className="bg-white border rounded-lg p-2 text-sm" value={newClient.firstName} onChange={e => setNewClient({...newClient, firstName: e.target.value})} />
                          <input placeholder="الاسم العائلي" className="bg-white border rounded-lg p-2 text-sm" value={newClient.lastName} onChange={e => setNewClient({...newClient, lastName: e.target.value})} />
                          <input placeholder="الهاتف" className="bg-white border rounded-lg p-2 text-sm" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                          <input placeholder="رقم البطاقة (CIN)" className="bg-white border rounded-lg p-2 text-sm" value={newClient.cin} onChange={e => setNewClient({...newClient, cin: e.target.value})} />
                      </div>
                   )}
                </div>
             </div>

             {/* 2. Dress & Dates */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold ml-3">2</div>
                   <h3 className="font-bold text-slate-800">الفستان والتاريخ</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">اختر الفستان</label>
                      <select 
                        value={rentalData.dressId} 
                        onChange={e => setRentalData({...rentalData, dressId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
                     >
                         <option value="">-- اختر من القائمة --</option>
                         {dresses.filter(d => d.status === DressStatus.AVAILABLE || d.status === DressStatus.RENTED).map(d => (
                            <option key={d.id} value={d.id}>{d.name} - {d.reference} ({d.size})</option>
                         ))}
                      </select>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">تاريخ البدء</label>
                        <input type="date" value={rentalData.startDate} onChange={e => setRentalData({...rentalData, startDate: e.target.value})} className="w-full bg-white border rounded-lg p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">تاريخ الإرجاع</label>
                        <input type="date" value={rentalData.endDate} onChange={e => setRentalData({...rentalData, endDate: e.target.value})} className="w-full bg-white border rounded-lg p-2 text-sm" />
                      </div>
                   </div>
                </div>

                {/* Availability Status */}
                {selectedRefDress && rentalData.endDate && (
                   <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${isAvailable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      {isAvailable ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                      <div>
                         <p className="font-bold text-sm block">{isAvailable ? 'الفستان متاح!' : 'الفستان غير متاح'}</p>
                         <p className="text-xs opacity-80 mt-1">
                            {isAvailable 
                              ? `يمكنك حجز "${selectedRefDress.name}" في هذه الفترة.` 
                              : `هذا الفستان محجوز بالفعل في تاريخ واحد أو أكثر ضمن الفترة المحددة.`}
                         </p>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Right Column: Summary & Action */}
          <div className="lg:col-span-1">
             <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl sticky top-6">
                <h3 className="font-bold text-lg mb-6 flex items-center"><Calendar className="ml-2 w-5 h-5" /> ملخص الحجز</h3>
                
                <div className="space-y-4 mb-8">
                   <div className="flex justify-between text-sm py-2 border-b border-slate-700">
                      <span className="text-slate-400">الفستان</span>
                      <span className="font-medium">{selectedRefDress?.name || '-'}</span>
                   </div>
                   <div className="flex justify-between text-sm py-2 border-b border-slate-700">
                      <span className="text-slate-400">السعر اليومي</span>
                      <span className="font-medium">{selectedRefDress?.pricePerDay || 0} درهم</span>
                   </div>
                   <div className="flex justify-between text-sm py-2 border-b border-slate-700">
                      <span className="text-slate-400">عدد الأيام</span>
                      <span className="font-medium">
                        {rentalData.endDate ? (Math.ceil(Math.abs(new Date(rentalData.endDate).getTime() - new Date(rentalData.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1) : 0}
                      </span>
                   </div>
                   <div className="flex justify-between text-lg font-bold pt-2 text-indigo-400">
                      <span>الإجمالي</span>
                      <span>
                         {selectedRefDress && rentalData.endDate ? 
                           (selectedRefDress.pricePerDay * (Math.ceil(Math.abs(new Date(rentalData.endDate).getTime() - new Date(rentalData.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1)) 
                           : 0} درهم
                      </span>
                   </div>
                </div>

                <button 
                  onClick={handleRent}
                  disabled={!isAvailable || (!rentalData.clientId && (!newClient.firstName || !newClient.lastName))}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                   تأكيد وإنشاء العقد
                </button>
                <p className="text-xs text-center text-slate-500 mt-4">سيتم إنشاء العقد وتحديث المخزون تلقائياً</p>
             </div>
          </div>
       </div>
     );
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 space-x-reverse px-4 py-2">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Shirt size={20} />
             </div>
             <div>
                <h2 className="font-bold text-slate-800">تأجير الفساتين</h2>
                <div className="flex space-x-2 space-x-reverse text-xs text-slate-500">
                   <span>{rentals.filter(r => r.status === 'ACTIVE').length} تأجير نشط</span>
                   <span>•</span>
                   <span>{dresses.length} فستان</span>
                </div>
             </div>
          </div>
          
          <div className="flex bg-slate-50 p-1 rounded-xl w-full md:w-auto">
              {[
                { id: 'RENTALS', label: 'العمليات', icon: History },
                { id: 'INVENTORY', label: 'المخزون', icon:  Settings},
                { id: 'NEW_RENTAL', label: 'تأجير جديد', icon: Plus },
              ].map(tab => {
                 const Icon = tab.icon;
                 const isActive = activeTab === tab.id;
                 return (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                     }`}
                   >
                     <Icon size={14} className="ml-2" />
                     {tab.label}
                   </button>
                 );
              })}
          </div>
      </div>

      {/* Content */}
      {activeTab === 'RENTALS' && renderRentalsView()}
      {activeTab === 'INVENTORY' && renderInventoryView()}
      {activeTab === 'NEW_RENTAL' && renderNewRental()}
    </div>
  );
};
