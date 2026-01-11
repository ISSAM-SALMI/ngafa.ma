import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleType, NgafaBookingItem, NgafaEvent, NgafaItem, Client } from '../../types';
import { 
  Package, Search, Calendar, ChevronLeft, Plus, Minus, Settings, 
  Edit2, Trash2, Save, X, Printer, Check, ShoppingCart, User 
} from 'lucide-react';
import { printReceipt } from '../../utils/printReceipt';

export const NgafaModule = () => {
  const { 
    clients, ngafaItems, ngafaEvents, 
    addClient, deleteClient, addNgafaEvent, deleteNgafaEvent,
    addNgafaItem, updateNgafaItem, deleteNgafaItem 
  } = useApp();

  // Tabs: NEW_EVENT (Booking), EVENTS (History), INVENTORY (Stock)
  const [activeTab, setActiveTab] = useState<'NEW_EVENT' | 'EVENTS' | 'INVENTORY'>('NEW_EVENT');

  // --- NEW EVENT STATE ---
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<{itemId: string, qty: number}[]>([]); 

  // --- INVENTORY STATE ---
  const [itemForm, setItemForm] = useState<{id?: string, name: string, category: string, price: string, quantity: string}>({
    name: '', category: '', price: '', quantity: ''
  });
  const [editingItem, setEditingItem] = useState<NgafaItem | null>(null);

  // --- DETAIL VIEW STATE ---
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  // --- COMPUTED ---
  const ngafaClients = useMemo(() => {
    return clients.filter(c => 
      c.module === ModuleType.NGAFA || 
      ngafaEvents.some(e => e.clientId === c.id)
    );
  }, [clients, ngafaEvents]);
  
  const filteredClients = useMemo(() => {
    // If searching, search ALL clients (to find from other modules)
    // If not searching, show only Ngafa-relevant clients
    const sourceList = searchTerm ? clients : ngafaClients;
    
    if(!searchTerm) return sourceList;

    const lower = searchTerm.toLowerCase();
    return sourceList.filter(c => 
      c.firstName.toLowerCase().includes(lower) || 
      c.lastName.toLowerCase().includes(lower) ||
      c.phone.includes(searchTerm)
    );
  }, [searchTerm, ngafaClients, clients]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
        const itemDef = ngafaItems.find(i => i.id === item.itemId);
        return sum + (Number(itemDef?.price || 0) * item.qty);
    }, 0);
  }, [cart, ngafaItems]);

  const viewingEvent = useMemo(() => ngafaEvents.find(e => e.id === viewingEventId), [ngafaEvents, viewingEventId]);
  const viewingEventClient = useMemo(() => clients.find(c => c.id === viewingEvent?.clientId), [clients, viewingEvent]);

  // --- HELPER METHODS ---

  const getAvailableStock = (itemId: string, date: string) => {
    const item = ngafaItems.find(i => i.id === itemId);
    if (!item) return 0;
    
    const reserved = ngafaEvents
      .filter(e => e.eventDate === date && e.status !== 'CANCELLED')
      .reduce((acc, e) => {
        const lineItem = e.items.find(i => i.itemId === itemId);
        return acc + (lineItem ? lineItem.quantity : 0);
      }, 0);
      
    // Subtract what's currently in cart if for same date (conceptual, but user is building it)
    const inCart = cart.find(c => c.itemId === itemId)?.qty || 0;
      
    return item.totalQuantity - reserved - inCart;
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addClient({
      id: crypto.randomUUID(),
      ...newClient,
      module: ModuleType.NGAFA,
      createdAt: new Date().toISOString()
    });
    
    if (created) {
      setSelectedClientId(created.id);
      setIsCreatingClient(false);
      setNewClient({ firstName: '', lastName: '', phone: '' });
      setSearchTerm(''); 
    }
  };

  const updateCart = (itemId: string, delta: number) => {
    // Only verify stock if adding
    if (delta > 0) {
        const available = getAvailableStock(itemId, eventDate);
        if (available < delta) return; // Not enough stock
    }

    setCart(prev => {
        const existing = prev.find(i => i.itemId === itemId);
        
        if (!existing) {
            if (delta <= 0) return prev;
            return [...prev, { itemId, qty: delta }];
        }

        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(i => i.itemId !== itemId);
        
        return prev.map(i => i.itemId === itemId ? { ...i, qty: newQty } : i);
    });
  };

  const handleBookEvent = async () => {
    if (!selectedClientId || cart.length === 0) return;

    const bookingItems: NgafaBookingItem[] = cart.map(c => {
      const itemDef = ngafaItems.find(i => i.id === c.itemId);
      const price = Number(itemDef?.price || 0);
      return {
        itemId: c.itemId,
        quantity: c.qty,
        priceAtBooking: price
      };
    });

    const newEvent: NgafaEvent = {
        id: crypto.randomUUID(),
        clientId: selectedClientId,
        eventDate,
        items: bookingItems,
        status: 'CONFIRMED',
        totalPrice: cartTotal
    };

    await addNgafaEvent(newEvent);
    
    // Success: View details
    setViewingEventId(newEvent.id);
    setActiveTab('EVENTS');
    
    // Reset
    setCart([]);
    setSelectedClientId(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(itemForm.price);
    const qty = Number(itemForm.quantity);
    if (!itemForm.name || isNaN(price)) return;

    if (editingItem) {
        await updateNgafaItem({
            ...editingItem,
            name: itemForm.name,
            category: itemForm.category,
            price,
            totalQuantity: qty
        });
        setEditingItem(null);
    } else {
        await addNgafaItem({
            id: crypto.randomUUID(),
            name: itemForm.name,
            category: itemForm.category || 'عام',
            price,
            totalQuantity: qty
        });
    }
    setItemForm({ name: '', category: '', price: '', quantity: '' });
  };

  const handleEditItem = (item: NgafaItem) => {
      setEditingItem(item);
      setItemForm({
          name: item.name,
          category: item.category,
          price: item.price.toString(),
          quantity: item.totalQuantity.toString()
      });
  };

  const handlePrintEvent = async (event: NgafaEvent) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/ngafa-events/${event.id}/contract/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contract_${event.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('فشل تحميل العقد. يرجى المحاولة مرة أخرى.');
        }
    } catch (error) {
        console.error('Download PDF error:', error);
        alert('حدث خطأ أثناء تحميل العقد');
    }
 };

 const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
        await deleteNgafaEvent(id);
        if(viewingEventId === id) setViewingEventId(null);
    }
 };

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Package className="ml-2 text-amber-500" /> خدمات النكافة
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => { setActiveTab('NEW_EVENT'); setViewingEventId(null); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'NEW_EVENT' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-amber-500'}`}
                >
                  حجز جديد
                </button>
                <button 
                  onClick={() => { setActiveTab('EVENTS'); setViewingEventId(null); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'EVENTS' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-amber-500'}`}
                >
                  سجل المناسبات
                </button>
                <button 
                  onClick={() => { setActiveTab('INVENTORY'); setViewingEventId(null); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'INVENTORY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  المخزون
                </button>
            </div>
        </div>

        {/* --- TAB: NEW EVENT --- */}
        {activeTab === 'NEW_EVENT' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                 {/* 1. Client Selection */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                     <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex justify-between items-center">
                         <span>1. العميل والتاريخ</span>
                         <button onClick={() => setIsCreatingClient(!isCreatingClient)} className="text-xs bg-slate-200 px-2 py-1 rounded">
                             {isCreatingClient ? 'إلغاء' : 'جديد +'}
                         </button>
                     </div>
                     <div className="p-4 flex-1 overflow-y-auto space-y-4">
                         <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">تاريخ المناسبة</label>
                             <input type="date" className="w-full border p-2 rounded text-sm" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                         </div>

                         {isCreatingClient ? (
                             <form onSubmit={handleCreateClient} className="space-y-3 pt-2 border-t">
                                 <input required placeholder="الاسم الأول" className="w-full border p-2 rounded text-sm" value={newClient.firstName} onChange={e => setNewClient({...newClient, firstName: e.target.value})} />
                                 <input required placeholder="الاسم العائلي" className="w-full border p-2 rounded text-sm" value={newClient.lastName} onChange={e => setNewClient({...newClient, lastName: e.target.value})} />
                                 <input required placeholder="الهاتف" className="w-full border p-2 rounded text-sm" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                                 <button className="w-full bg-slate-800 text-white py-2 rounded text-sm">حفظ</button>
                             </form>
                         ) : (
                             <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="بحث عن عميل..."
                                        className="w-full border pl-10 pr-4 py-2 rounded text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    {filteredClients.map(c => (
                                        <div 
                                            key={c.id} 
                                            onClick={() => setSelectedClientId(c.id)}
                                            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${selectedClientId === c.id ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            <div>
                                                <p className="font-medium text-sm text-slate-800">{c.firstName} {c.lastName}</p>
                                                <p className="text-xs text-slate-500">{c.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if(window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                                                            deleteClient(c.id);
                                                            if(selectedClientId === c.id) setSelectedClientId(null);
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="حذف العميل"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {selectedClientId === c.id && <Check className="w-4 h-4 text-amber-600" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </>
                         )}
                     </div>
                 </div>

                 {/* 2. Items Selection */}
                 <div className={`bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden transition-opacity ${!selectedClientId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                     <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
                         2. اختيار المعدات
                     </div>
                     <div className="p-2 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            {ngafaItems.map(item => {
                                const available = getAvailableStock(item.id, eventDate);
                                const inCart = cart.find(c => c.itemId === item.id)?.qty || 0;
                                return (
                                    <div key={item.id} className="p-3 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-slate-500">{item.category}</span>
                                                <span className={available > 0 ? "text-green-600" : "text-red-500"}>
                                                    (متاح: {available})
                                                </span>
                                            </div>
                                            <p className="font-bold text-amber-600 text-sm mt-1">{Number(item.price).toFixed(2)} درهم</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {inCart > 0 && (
                                                <>
                                                    <button onClick={() => updateCart(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200">-</button>
                                                    <span className="font-bold w-4 text-center">{inCart}</span>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => updateCart(item.id, 1)}
                                                disabled={available <= 0}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                 </div>

                 {/* 3. Summary */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                     <div>
                         <h3 className="font-bold text-slate-800 mb-6">ملخص الحجز</h3>
                         {selectedClient && (
                             <div className="bg-amber-50 p-4 rounded-lg mb-6">
                                 <p className="font-bold text-slate-800">{selectedClient.firstName} {selectedClient.lastName}</p>
                                 <p className="text-sm text-slate-600">{eventDate}</p>
                             </div>
                         )}

                         <div className="space-y-3 mb-6">
                             {cart.map(c => {
                                 const item = ngafaItems.find(i => i.id === c.itemId);
                                 if(!item) return null;
                                 return (
                                     <div key={c.itemId} className="flex justify-between text-sm">
                                         <span>{item.name} <span className="text-slate-400">x{c.qty}</span></span>
                                         <span>{(Number(item.price) * c.qty).toFixed(2)}</span>
                                     </div>
                                 )
                             })}
                             {cart.length > 0 && (
                                 <div className="border-t pt-3 flex justify-between font-bold text-lg text-amber-600">
                                     <span>المجموع</span>
                                     <span>{cartTotal.toFixed(2)} درهم</span>
                                 </div>
                             )}
                         </div>
                     </div>
                     <button 
                        onClick={handleBookEvent}
                        disabled={!selectedClientId || cart.length === 0}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
                     >
                         تأكيد الحجز
                     </button>
                 </div>
             </div>
        )}

        {/* --- TAB: EVENTS & DETAILS --- */}
        {activeTab === 'EVENTS' && (
            viewingEvent ? (
                // DETAIL VIEW
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="space-y-6">
                         <button onClick={() => setViewingEventId(null)} className="flex items-center text-slate-500 hover:text-slate-800 mb-2">
                             <ChevronLeft className="w-4 h-4 ml-1" /> العودة للقائمة
                         </button>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                             <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-2xl font-bold mb-4 mx-auto">
                                 {viewingEventClient?.firstName.charAt(0)}
                             </div>
                             <h2 className="text-xl font-bold text-center text-slate-800">{viewingEventClient?.firstName} {viewingEventClient?.lastName}</h2>
                             <div className="text-center mt-2">
                                <span className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-600 font-medium">{viewingEvent.eventDate}</span>
                             </div>
                             
                             <div className="mt-8 border-t pt-4 flex justify-between items-center">
                                 <span className="text-slate-500">الحالة</span>
                                 <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">مؤكد</span>
                             </div>
                             <div className="mt-2 flex justify-between items-center">
                                 <span className="text-slate-500">المبلغ الإجمالي</span>
                                 <span className="font-bold text-amber-600 text-lg">{Number(viewingEvent.totalPrice).toFixed(2)} درهم</span>
                             </div>
                             
                             <button 
                                onClick={() => handlePrintEvent(viewingEvent)}
                                className="w-full mt-6 flex justify-center items-center gap-2 border border-slate-200 py-2 rounded-lg text-slate-600 hover:bg-slate-50"
                             >
                                 <Printer className="w-4 h-4" /> طباعة العقد
                             </button>
                         </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex justify-between items-center">
                            <span>تفاصيل الخدمات والمعدات</span>
                            <div className="text-sm font-normal text-slate-500">
                                العميل: <span className="font-bold text-slate-800">{viewingEventClient?.firstName} {viewingEventClient?.lastName}</span>
                            </div>
                        </div>
                        <table className="w-full text-right text-sm">
                            <thead className="text-slate-500 bg-slate-50/50">
                                <tr>
                                    <th className="p-4">المعدات</th>
                                    <th className="p-4">الكمية</th>
                                    <th className="p-4">سعر الوحدة</th>
                                    <th className="p-4">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewingEvent.items.map((item, idx) => {
                                    const itemDef = ngafaItems.find(i => i.id === item.itemId);
                                    return (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="p-4 font-medium">{itemDef?.name || '---'}</td>
                                            <td className="p-4">{item.quantity}</td>
                                            <td className="p-4 text-slate-500">{Number(item.priceAtBooking).toFixed(2)}</td>
                                            <td className="p-4 font-bold">{(Number(item.priceAtBooking) * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // LIST VIEW
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">سجل المناسبات</h3>
                    </div>
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">العميل</th>
                                <th className="p-4">عدد القطع</th>
                                <th className="p-4">المبلغ</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {ngafaEvents.slice().reverse().map(event => {
                                const client = clients.find(c => c.id === event.clientId);
                                const totalItems = event.items.reduce((a,b) => a + b.quantity, 0);
                                return (
                                    <tr key={event.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setViewingEventId(event.id)}>
                                        <td className="p-4">{event.eventDate}</td>
                                        <td className="p-4 font-medium">{client ? `${client.firstName} ${client.lastName}` : '---'}</td>
                                        <td className="p-4">{totalItems} قطعة</td>
                                        <td className="p-4 font-bold text-amber-600">{Number(event.totalPrice).toFixed(2)}</td>
                                        <td className="p-4 text-left">
                                            <button 
                                                onClick={(e) => handleDeleteEvent(event.id, e)}
                                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
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

        {/* --- TAB: INVENTORY --- */}
        {activeTab === 'INVENTORY' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Item Form */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4">{editingItem ? 'تعديل معدات' : 'إضافة معدات جديدة'}</h3>
                    <form onSubmit={handleSaveItem} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">الاسم</label>
                            <input required className="w-full border rounded-lg p-2 text-sm" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">الفئة</label>
                            <input required className="w-full border rounded-lg p-2 text-sm" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">الكمية الكلية</label>
                                <input required type="number" className="w-full border rounded-lg p-2 text-sm" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">سعر الكراء</label>
                                <input required type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                             {editingItem && (
                                <button type="button" onClick={() => { setEditingItem(null); setItemForm({name:'', category:'', price:'', quantity:''}); }} className="px-4 py-2 bg-slate-100 rounded text-slate-600 font-medium text-sm">إلغاء</button>
                             )}
                             <button className="flex-1 bg-slate-900 text-white py-2 rounded font-medium text-sm">حفظ</button>
                        </div>
                    </form>
                 </div>

                 {/* Inventory List */}
                 <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                     <table className="w-full text-right text-sm">
                         <thead className="bg-slate-50 text-slate-500">
                             <tr>
                                 <th className="p-4">المعدات</th>
                                 <th className="p-4">الفئة</th>
                                 <th className="p-4">سعر الكراء</th>
                                 <th className="p-4">المخزون</th>
                                 <th className="p-4"></th>
                             </tr>
                         </thead>
                         <tbody>
                             {ngafaItems.map(item => (
                                 <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                                     <td className="p-4 font-medium">{item.name}</td>
                                     <td className="p-4 text-slate-500">{item.category}</td>
                                     <td className="p-4 font-bold text-amber-600">{Number(item.price).toFixed(2)}</td>
                                     <td className="p-4">
                                         <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{item.totalQuantity}</span>
                                     </td>
                                     <td className="p-4 text-left flex justify-end gap-2">
                                         <button onClick={() => handleEditItem(item)} className="text-indigo-500 hover:text-indigo-700">
                                             <Edit2 className="w-4 h-4" />
                                         </button>
                                         <button onClick={() => deleteNgafaItem(item.id)} className="text-red-500 hover:text-red-700">
                                             <Trash2 className="w-4 h-4" />
                                         </button>
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
