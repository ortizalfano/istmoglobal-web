
export type Language = 'en' | 'es';

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  image?: string;
}

export interface Product {
  id: string;
  brandId: string;
  size: string;
  categoryId: string; // Changed from category string to ID
  description: string;
  image: string;
  price: number;
  status: 'Active' | 'Inactive';
}

export interface Prospect {
  id: string;
  name: string;
  company: string;
  country: string;
  email: string;
  productOfInterest?: string;
  message: string;
  status: 'New' | 'Contacted' | 'In Negotiation' | 'Closed' | 'Discarded';
  createdAt: string;
}


export interface User {
  id: string;
  email: string;
  role: 'admin' | 'b2c' | 'b2b';
  name: string;
  company?: string;
  password?: string; // Stored safely in real apps, simplified here
  details?: {
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
  };
  createdAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: string; // JSON string of CartItem[]
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export interface Translation {
  [key: string]: {
    en: string;
    es: string;
  };
}

export interface SiteSettings {
  show_prices: boolean;
}

