import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, Client, SalonService, SalonVisit, Dress, DressRental, 
  NgafaItem, NgafaEvent, UserRole, ModuleType
} from '../types';

const API_URL = '/api';

interface AppContextType {
  user: User | null;
  usersList: User[];
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  // Data... (rest of interface)
  // Data
  clients: Client[];
  services: SalonService[];
  visits: SalonVisit[];
  dresses: Dress[];
  rentals: DressRental[];
  ngafaItems: NgafaItem[];
  ngafaEvents: NgafaEvent[];

  // Actions
  addUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addClient: (client: Client) => Promise<Client | void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addVisit: (visit: SalonVisit) => Promise<void>;

  // Service Actions
  addService: (service: SalonService) => Promise<void>;
  updateService: (service: SalonService) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  addDress: (dress: Dress, imageFile?: File) => Promise<void>;
  updateDress: (dress: Dress, imageFile?: File) => Promise<void>;
  deleteDress: (id: string) => Promise<void>;
  
  addRental: (rental: DressRental) => Promise<void>;
  returnRental: (id: string) => Promise<void>;
  
  // Ngafa Actions
  addNgafaEvent: (event: NgafaEvent) => Promise<void>;
  deleteNgafaEvent: (id: string) => Promise<void>;
  addNgafaItem: (item: NgafaItem) => Promise<void>;
  updateNgafaItem: (item: NgafaItem) => Promise<void>;
  deleteNgafaItem: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // --- Data State ---
  const [usersList, setUsersList] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [visits, setVisits] = useState<SalonVisit[]>([]);
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [rentals, setRentals] = useState<DressRental[]>([]);
  const [ngafaItems, setNgafaItems] = useState<NgafaItem[]>([]);
  const [ngafaEvents, setNgafaEvents] = useState<NgafaEvent[]>([]);

  // Persist User Session
  useEffect(() => {
    if (user) localStorage.setItem('erp_user', JSON.stringify(user));
    else localStorage.removeItem('erp_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  // Fetch Initial Data
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    const headers = { 'Authorization': `Token ${token}` };
    try {
        const [cRes, sRes, vRes, dRes, rRes, nRes, eRes, uRes] = await Promise.all([
            fetch(`${API_URL}/clients/`, { headers }),
            fetch(`${API_URL}/salon-services/`, { headers }),
            fetch(`${API_URL}/salon-visits/`, { headers }),
            fetch(`${API_URL}/dresses/`, { headers }),
            fetch(`${API_URL}/dress-rentals/`, { headers }),
            fetch(`${API_URL}/ngafa-items/`, { headers }),
            fetch(`${API_URL}/ngafa-events/`, { headers }),
            fetch(`${API_URL}/users/`, { headers }),
        ]);

        if (cRes.ok) {
            const data = await cRes.json();
            setClients(data.map((c: any) => ({
                id: c.id.toString(),
                firstName: c.first_name,
                lastName: c.last_name,
                phone: c.phone,
                cin: c.cin,
                notes: c.notes,
                module: c.module,
                createdAt: c.created_at
            })));
        }
        if (sRes.ok) {
            const data = await sRes.json();
            setServices(data.map((s: any) => ({
                id: s.id.toString(),
                name: s.name,
                price: parseFloat(s.price)
            })));
        }
        if (vRes.ok) {
            const data = await vRes.json();
            setVisits(data.map((v: any) => ({
                id: v.id.toString(),
                clientId: v.client.toString(),
                date: v.date,
                services: v.services_details.map((s: any) => ({ ...s, id: s.id.toString(), price: parseFloat(s.price) })),
                totalAmount: parseFloat(v.total_amount),
                status: v.status
            })));
        }
        if (dRes.ok) {
            const data = await dRes.json();
            setDresses(data.map((d: any) => ({
                id: d.id.toString(),
                name: d.name,
                reference: d.reference,
                size: d.size,
                color: d.color,
                pricePerDay: parseFloat(d.price_per_day),
                status: d.status,
                image: d.image
            })));
        }
        if (rRes.ok) {
            const data = await rRes.json();
            setRentals(data.map((r: any) => ({
                id: r.id.toString(),
                clientId: r.client.toString(),
                dressId: r.dress.toString(),
                startDate: r.start_date,
                endDate: r.end_date,
                totalPrice: parseFloat(r.total_price),
                status: r.status
            })));
        }
        if (nRes.ok) {
            const data = await nRes.json();
            setNgafaItems(data.map((i: any) => ({
                id: i.id.toString(),
                name: i.name,
                category: i.category,
                totalQuantity: i.total_quantity,
                price: parseFloat(i.price),
                description: i.description
            })));
        }
        if (eRes.ok) {
             const data = await eRes.json();
             // Mapping complex nested items
             setNgafaEvents(data.map((e: any) => ({
                 id: e.id.toString(),
                 clientId: e.client.toString(),
                 eventDate: e.event_date,
                 status: e.status,
                 totalPrice: parseFloat(e.total_price || '0'),
                 items: e.items.map((bi: any) => ({
                     itemId: bi.item.toString(),
                     quantity: bi.quantity,
                     priceAtBooking: parseFloat(bi.price_at_booking)
                 }))
             })));
        }
        if (uRes.ok) {
            const data = await uRes.json();
            setUsersList(data.map((u: any) => ({
                id: u.id.toString(),
                username: u.username,
                name: u.first_name || u.username,
                role: u.is_superuser ? 'ADMIN' : 'EMPLOYEE'
            })));
        }
        
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
  };


  const login = async (username: string, password?: string) => {
    try {
        const res = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            const data = await res.json();
            setToken(data.token);
            
            // Get user details
            const userRes = await fetch(`${API_URL}/auth/me/`, {
                headers: { 'Authorization': `Token ${data.token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                const mappedUser: User = {
                    id: userData.id.toString(),
                    username: userData.username,
                    name: userData.first_name || userData.username,
                    role: userData.is_superuser ? UserRole.ADMIN : UserRole.EMPLOYEE
                };
                setUser(mappedUser);
                return true;
            }
        }
    } catch (e) {
        console.error("Login error", e);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('token');
  };

  // --- CRUD helpers ---
  const apiCall = async (endpoint: string, method: string, body?: any) => {
     if (!token) return null;
     
     const headers: any = { 'Authorization': `Token ${token}` };
     let finalBody = body;

     if (!(body instanceof FormData)) {
         headers['Content-Type'] = 'application/json';
         finalBody = body ? JSON.stringify(body) : undefined;
     }

     const res = await fetch(`${API_URL}/${endpoint}/`, {
         method,
         headers,
         body: finalBody
     });
     if (res.ok) {
         if (method !== 'DELETE') return await res.json();
         return true;
     }
     console.error(`API Error on ${endpoint}:`, res.statusText);
     return null;
  };

  // User Management
  const addUser = async (newUser: User) => {
    const payload = {
        username: newUser.username,
        password: newUser.password,
        first_name: newUser.name,
        is_staff: true, 
        is_superuser: newUser.role === UserRole.ADMIN
    };
    
    const saved = await apiCall('users', 'POST', payload);
    if (saved) {
        const mappedUser: User = {
            id: saved.id.toString(),
            username: saved.username,
            name: saved.first_name || saved.username,
            role: saved.is_superuser ? UserRole.ADMIN : UserRole.EMPLOYEE
        };
        setUsersList(prev => [...prev, mappedUser]);
    }
  };
  
  const deleteUser = async (id: string) => {
    const deleted = await apiCall(`users/${id}`, 'DELETE');
    if (deleted) {
        setUsersList(prev => prev.filter(u => u.id !== id));
    }
  };

  // Client CRUD
  const addClient = async (client: Client) => {
    // Map camelCase to snake_case
    const payload = {
        first_name: client.firstName,
        last_name: client.lastName,
        phone: client.phone,
        cin: client.cin,
        notes: client.notes,
        module: client.module,
        created_at: client.createdAt
    };
    const saved = await apiCall('clients', 'POST', payload);
    if (saved) {
        // Map back to camelCase
        const newClient: Client = {
            id: saved.id.toString(),
            firstName: saved.first_name,
            lastName: saved.last_name,
            phone: saved.phone,
            cin: saved.cin,
            notes: saved.notes,
            module: saved.module,
            createdAt: saved.created_at
        };
        setClients(prev => [...prev, newClient]);
        return newClient;
    }
  };

  const updateClient = async (client: Client) => {
    const payload = {
        first_name: client.firstName,
        last_name: client.lastName,
        phone: client.phone,
        cin: client.cin,
        notes: client.notes,
        module: client.module
    };
    const saved = await apiCall(`clients/${client.id}`, 'PUT', payload);
    if (saved) {
        const updatedClient: Client = {
            id: saved.id.toString(),
            firstName: saved.first_name,
            lastName: saved.last_name,
            phone: saved.phone,
            cin: saved.cin,
            notes: saved.notes,
            module: saved.module,
            createdAt: saved.created_at
        };
        setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
    }
  };

  const deleteClient = async (id: string) => {
    if (await apiCall(`clients/${id}`, 'DELETE')) {
        setClients(prev => prev.filter(c => c.id !== id));
    }
  };
  
  const addVisit = async (visit: SalonVisit) => {
      let isoDate = visit.date;
      if (isoDate.length === 10) { 
          isoDate = new Date(visit.date).toISOString(); 
      }

      const payload = {
          client: visit.clientId,
          date: isoDate,
          services: visit.services.map(s => s.id), 
          total_amount: visit.totalAmount,
          status: visit.status
      };
      
      const saved = await apiCall('salon-visits', 'POST', payload);
      
      if (saved) {
           const newVisit: SalonVisit = {
               id: saved.id.toString(),
               clientId: saved.client.toString(),
               date: saved.date,
               services: saved.services_details ? saved.services_details.map((s: any) => ({ ...s, id: s.id.toString(), price: parseFloat(s.price) })) : [], 
               totalAmount: parseFloat(saved.total_amount),
               status: saved.status
           };
           // Use a new reference for the array to ensure React re-renders
           setVisits(prev => {
             const updated = [...prev, newVisit];
             return updated;
           });
           
           // Hack: Force a quick re-fetch to ensure consistency if the local mapping missed something
           // Not ideal but ensures "automatic update" feeling for now
           // fetchVisitsOnly(); // Optional optimization
      }
  };

  // Service Actions
  const addService = async (service: SalonService) => {
    const saved = await apiCall('salon-services', 'POST', service);
    if (saved) {
        setServices(prev => [...prev, { ...saved, id: saved.id.toString(), price: parseFloat(saved.price) }]);
    }
  };
  const updateService = async (service: SalonService) => {
    const saved = await apiCall(`salon-services/${service.id}`, 'PUT', service);
    if (saved) {
        setServices(prev => prev.map(s => s.id === service.id ? { ...saved, id: saved.id.toString(), price: parseFloat(saved.price) } : s));
    }
  };
  const deleteService = async (id: string) => {
      if (await apiCall(`salon-services/${id}`, 'DELETE')) {
        setServices(prev => prev.filter(s => s.id !== id));
      }
  };
  
  const addDress = async (dress: Dress, imageFile?: File) => {
    let payload: any;
    if (imageFile) {
        payload = new FormData();
        payload.append('name', dress.name);
        payload.append('reference', dress.reference);
        payload.append('size', dress.size);
        payload.append('color', dress.color);
        payload.append('price_per_day', dress.pricePerDay.toString());
        payload.append('status', dress.status);
        payload.append('image', imageFile);
    } else {
        payload = {
            name: dress.name,
            reference: dress.reference,
            size: dress.size,
            color: dress.color,
            price_per_day: dress.pricePerDay,
            status: dress.status
        };
    }

    const saved = await apiCall('dresses', 'POST', payload);
    if (saved) {
        const newDress: Dress = {
            id: saved.id.toString(),
            name: saved.name,
            reference: saved.reference,
            size: saved.size,
            color: saved.color,
            pricePerDay: parseFloat(saved.price_per_day),
            status: saved.status,
            image: saved.image
        };
        setDresses(prev => [...prev, newDress]);
    }
  };
  const updateDress = async (dress: Dress, imageFile?: File) => {
    let payload: any;
    if (imageFile) {
        payload = new FormData();
        payload.append('name', dress.name);
        payload.append('reference', dress.reference);
        payload.append('size', dress.size);
        payload.append('color', dress.color);
        payload.append('price_per_day', dress.pricePerDay.toString());
        payload.append('status', dress.status);
        if(imageFile) payload.append('image', imageFile);
    } else {
        payload = {
            name: dress.name,
            reference: dress.reference,
            size: dress.size,
            color: dress.color,
            price_per_day: dress.pricePerDay,
            status: dress.status
        };
    }
    const saved = await apiCall(`dresses/${dress.id}`, 'PUT', payload);
    if (saved) {
        const updatedDress: Dress = {
            id: saved.id.toString(),
            name: saved.name,
            reference: saved.reference,
            size: saved.size,
            color: saved.color,
            pricePerDay: parseFloat(saved.price_per_day),
            status: saved.status,
             image: saved.image
        };
        setDresses(prev => prev.map(d => d.id === dress.id ? updatedDress : d));
    }
  };
  const deleteDress = async (id: string) => {
      if (await apiCall(`dresses/${id}`, 'DELETE')) {
        setDresses(prev => prev.filter(d => d.id !== id));
      }
  };
  
  const addRental = async (rental: DressRental) => {
    const payload = {
        client: rental.clientId,
        dress: rental.dressId,
        start_date: rental.startDate,
        end_date: rental.endDate,
        total_price: rental.totalPrice,
        status: rental.status
    };
    const saved = await apiCall('dress-rentals', 'POST', payload);
    if (saved) {
        const newRental: DressRental = {
            id: saved.id.toString(),
            clientId: saved.client.toString(),
            dressId: saved.dress.toString(),
            startDate: saved.start_date,
            endDate: saved.end_date,
            totalPrice: parseFloat(saved.total_price),
            status: saved.status
        };
        setRentals(prev => [...prev, newRental]);
    }
  };
  const returnRental = async (id: string) => {
      // ... (already implemented correctly with API call, just relying on refreshing or mapping fallback)
      // The previous implementation for returnRental using PATCH 'status' is correct for backend.
      // We just need to make sure we parse the response correctly if we use it. 
      const rental = rentals.find(r => r.id === id);
      if (!rental) return;
      
      const saved = await apiCall(`dress-rentals/${id}`, 'PATCH', { status: 'RETURNED' });
      
      if (saved) {
        setRentals(prev => prev.map(r => r.id === id ? { ...r, status: 'RETURNED' } : r));
      } 
  };

  // Ngafa Actions
  const addNgafaEvent = async (event: NgafaEvent) => {
    const payload = {
        client: event.clientId,
        event_date: event.eventDate,
        status: event.status,
        total_price: event.totalPrice
    };
    const saved = await apiCall('ngafa-events', 'POST', payload);
    if (saved) {
        // Save Items
        const savedItems: any[] = [];
        for (const item of event.items) {
           await apiCall('ngafa-booking-items', 'POST', { 
               event: saved.id, 
               item: item.itemId, 
               quantity: item.quantity,
               price_at_booking: item.priceAtBooking 
           });
           savedItems.push(item);
        }
        
        const newEvent: NgafaEvent = {
             id: saved.id.toString(),
             clientId: saved.client.toString(),
             eventDate: saved.event_date,
             status: saved.status,
             totalPrice: parseFloat(saved.total_price),
             items: savedItems
        };
        setNgafaEvents(prev => [...prev, newEvent]);
    }
  };
  
  const addNgafaItem = async (item: NgafaItem) => {
    const payload = {
        name: item.name,
        category: item.category,
        total_quantity: item.totalQuantity,
        price: item.price,
        description: item.description
    };
    const saved = await apiCall('ngafa-items', 'POST', payload);
    if (saved) {
        setNgafaItems(prev => [...prev, {
            id: saved.id.toString(),
            name: saved.name,
            category: saved.category,
            totalQuantity: saved.total_quantity,
            price: parseFloat(saved.price),
            description: saved.description
        }]);
    }
  };
  const updateNgafaItem = async (item: NgafaItem) => {
    const payload = {
        name: item.name,
        category: item.category,
        total_quantity: item.totalQuantity,
        price: item.price,
        description: item.description
    };
    const saved = await apiCall(`ngafa-items/${item.id}`, 'PUT', payload);
    if (saved) {
        setNgafaItems(prev => prev.map(i => i.id === item.id ? {
            id: saved.id.toString(),
            name: saved.name,
            category: saved.category,
            totalQuantity: saved.total_quantity,
            price: parseFloat(saved.price),
            description: saved.description
        } : i));
    }
  };
  const deleteNgafaItem = async (id: string) => {
      if (await apiCall(`ngafa-items/${id}`, 'DELETE')) {
        setNgafaItems(prev => prev.filter(i => i.id !== id));
      }
  };

  const deleteNgafaEvent = async (id: string) => {
      if (await apiCall(`ngafa-events/${id}`, 'DELETE')) {
        setNgafaEvents(prev => prev.filter(e => e.id !== id));
      }
  };


  return (
    <AppContext.Provider value={{
      user, usersList, login, logout,
      clients, services, visits, dresses, rentals, ngafaItems, ngafaEvents,
      addUser, deleteUser,
      addClient, updateClient, deleteClient,
      addVisit,
      addService, updateService, deleteService,
      addDress, updateDress, deleteDress,
      addRental, returnRental,
      addNgafaEvent, deleteNgafaEvent,
      addNgafaItem, updateNgafaItem, deleteNgafaItem
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};