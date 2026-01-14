
import { Product, Prospect, Category, Brand } from './types';

export const getBrands = (): Brand[] => {
  const data = localStorage.getItem('ig_brands');
  return data ? JSON.parse(data) : INITIAL_BRANDS;
};

export const saveBrands = (brands: Brand[]) => {
  localStorage.setItem('ig_brands', JSON.stringify(brands));
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Passenger', description: 'Standard vehicles' },
  { id: 'cat_2', name: 'SUV', description: 'Sports utility vehicles' },
  { id: 'cat_3', name: 'Truck', description: 'Heavy duty transport' },
  { id: 'cat_4', name: 'Industrial', description: 'Specialized machinery' },
];

const INITIAL_BRANDS: Brand[] = [
  { id: 'brand_1', name: 'Michelin', description: 'Premium innovation.' },
  { id: 'brand_2', name: 'Bridgestone', description: 'World leader in tires.' },
  { id: 'brand_3', name: 'Continental', description: 'German engineering.' },
  { id: 'brand_4', name: 'Pirelli', description: 'High performance.' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', brandId: 'brand_1', size: '205/55 R16', categoryId: 'cat_1', description: 'High performance summer tire.', image: 'https://picsum.photos/seed/tire1/400/300', status: 'Active' },
  { id: '2', brandId: 'brand_2', size: '225/45 R17', categoryId: 'cat_2', description: 'Durability for all terrains.', image: 'https://picsum.photos/seed/tire2/400/300', status: 'Active' },
  { id: '3', brandId: 'brand_3', size: '245/40 R18', categoryId: 'cat_3', description: 'Long haul reliability.', image: 'https://picsum.photos/seed/tire3/400/300', status: 'Active' },
  { id: '4', brandId: 'brand_4', size: '195/65 R15', categoryId: 'cat_1', description: 'Eco-friendly urban driving.', image: 'https://picsum.photos/seed/tire4/400/300', status: 'Inactive' },
];

const INITIAL_PROSPECTS: Prospect[] = [
  { id: '1', name: 'John Doe', company: 'Global Logistics Inc', country: 'USA', email: 'john@example.com', message: 'Interested in bulk SUV tires.', status: 'New', createdAt: new Date().toISOString() },
  { id: '2', name: 'Maria Garcia', company: 'Tire Master Spain', country: 'Spain', email: 'maria@example.es', message: 'Looking for a partnership in Madrid.', status: 'In Negotiation', createdAt: new Date().toISOString() },
];

export const getCategories = (): Category[] => {
  const data = localStorage.getItem('ig_categories');
  return data ? JSON.parse(data) : INITIAL_CATEGORIES;
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem('ig_categories', JSON.stringify(categories));
};

export const getProducts = (): Product[] => {
  const data = localStorage.getItem('ig_products');
  return data ? JSON.parse(data) : INITIAL_PRODUCTS;
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem('ig_products', JSON.stringify(products));
};

export const getProspects = (): Prospect[] => {
  const data = localStorage.getItem('ig_prospects');
  return data ? JSON.parse(data) : INITIAL_PROSPECTS;
};

export const saveProspects = (prospects: Prospect[]) => {
  localStorage.setItem('ig_prospects', JSON.stringify(prospects));
};

export const addProspect = (prospect: Omit<Prospect, 'id' | 'createdAt' | 'status'>) => {
  const current = getProspects();
  const newProspect: Prospect = {
    ...prospect,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    status: 'New'
  };
  saveProspects([newProspect, ...current]);
};
