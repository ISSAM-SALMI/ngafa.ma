export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added for authentication
  role: UserRole;
  name: string;
}

export enum ModuleType {
  SALON = 'SALON',
  DRESSES = 'DRESSES',
  NGAFA = 'NGAFA'
}

// --- Shared ---
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  cin?: string; // Specifically for rentals
  notes?: string;
  module: ModuleType;
  createdAt: string;
}

// --- Module 1: Salon ---
export interface SalonService {
  id: string;
  name: string;
  price: number;
}

export interface SalonVisit {
  id: string;
  clientId: string;
  date: string;
  services: SalonService[]; // Snapshot of services at time of purchase
  totalAmount: number;
  status: 'COMPLETED' | 'CANCELLED';
}

// --- Module 2: Dresses ---
export enum DressStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Dress {
  id: string;
  name: string;
  reference: string;
  size: string;
  color: string;
  pricePerDay: number;
  status: DressStatus;
  image?: string;
}

export interface DressRental {
  id: string;
  clientId: string;
  dressId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'ACTIVE' | 'RETURNED' | 'CANCELLED';
}

// --- Module 3: Ngafa ---
export interface NgafaItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  price: number; // Added price per rental/event
  description?: string;
}

export interface NgafaBookingItem {
  itemId: string;
  quantity: number;
  priceAtBooking: number; // Optional if we track revenue here
}

export interface NgafaEvent {
  id: string;
  clientId: string;
  eventDate: string;
  items: NgafaBookingItem[];
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalPrice?: number; // Optional estimation
}