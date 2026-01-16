import sql from './db';
import { Brand, Category, Product, Prospect, User, Order } from './types';
import bcrypt from 'bcryptjs';

// --- Brands ---
export const fetchBrands = async (): Promise<Brand[]> => {
    try {
        const brands = await sql`SELECT * FROM brands`;
        return brands as Brand[];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
};

export const createBrand = async (brand: Omit<Brand, 'id'>) => {
    const id = crypto.randomUUID();
    await sql`INSERT INTO brands (id, name, description, image) VALUES (${id}, ${brand.name}, ${brand.description}, ${brand.image || null})`;
    return { ...brand, id };
};

export const updateBrand = async (brand: Brand) => {
    await sql`UPDATE brands SET name = ${brand.name}, description = ${brand.description}, image = ${brand.image || null} WHERE id = ${brand.id}`;
    return brand;
};

export const deleteBrand = async (id: string) => {
    await sql`DELETE FROM brands WHERE id = ${id}`;
    return id;
};

// --- Categories ---
export const fetchCategories = async (): Promise<Category[]> => {
    try {
        const categories = await sql`SELECT * FROM categories`;
        return categories as Category[];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

export const createCategory = async (category: Omit<Category, 'id'>) => {
    const id = crypto.randomUUID();
    await sql`INSERT INTO categories (id, name, description) VALUES (${id}, ${category.name}, ${category.description})`;
    return { ...category, id };
};

export const updateCategory = async (category: Category) => {
    await sql`UPDATE categories SET name = ${category.name}, description = ${category.description} WHERE id = ${category.id}`;
    return category;
};

export const deleteCategory = async (id: string) => {
    await sql`DELETE FROM categories WHERE id = ${id}`;
    return id;
};

// --- Products ---
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const products = await sql`SELECT * FROM products`;
        // Map snake_case DB columns to camelCase JS properties
        return products.map((p: any) => ({
            ...p,
            brandId: p.brand_id,
            categoryId: p.category_id,
            price: Number(p.price) || 0, // Ensure price is a number
            brand_id: undefined,
            category_id: undefined
        })) as Product[];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const createProduct = async (product: Omit<Product, 'id'>) => {
    const id = crypto.randomUUID();
    await sql`
        INSERT INTO products (id, brand_id, size, category_id, description, image, price, status)
        VALUES (${id}, ${product.brandId}, ${product.size}, ${product.categoryId}, ${product.description}, ${product.image}, ${product.price}, ${product.status})
    `;
    return { ...product, id };
};

export const updateProduct = async (product: Product) => {
    await sql`
        UPDATE products 
        SET brand_id = ${product.brandId}, 
            size = ${product.size}, 
            category_id = ${product.categoryId}, 
            description = ${product.description}, 
            image = ${product.image}, 
            price = ${product.price},
            status = ${product.status}
        WHERE id = ${product.id}
    `;
    return product;
};

export const deleteProduct = async (id: string) => {
    await sql`DELETE FROM products WHERE id = ${id}`;
    return id;
};

// --- Prospects ---
export const fetchProspects = async (): Promise<Prospect[]> => {
    try {
        const prospects = await sql`SELECT * FROM prospects ORDER BY created_at DESC`;
        // Map snake_case to camelCase
        return prospects.map((p: any) => ({
            ...p,
            createdAt: p.created_at,
            productOfInterest: p.product_of_interest,
            created_at: undefined,
            product_of_interest: undefined
        })) as Prospect[];
    } catch (error) {
        console.error('Error fetching prospects:', error);
        return [];
    }
};

export const createProspect = async (prospect: Omit<Prospect, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    try {
        await sql`
            INSERT INTO prospects (id, name, company, country, email, product_of_interest, message, status)
            VALUES (${id}, ${prospect.name}, ${prospect.company}, ${prospect.country}, ${prospect.email}, ${prospect.productOfInterest || null}, ${prospect.message}, 'New')
        `;
        return { ...prospect, id, status: 'New', createdAt: new Date().toISOString() };
    } catch (error) {
        console.error('Error creating prospect:', error);
        throw error;
    }
};

export const updateProspect = async (prospect: Prospect) => {
    await sql`
        UPDATE prospects 
        SET name = ${prospect.name}, 
            company = ${prospect.company}, 
            country = ${prospect.country}, 
            email = ${prospect.email}, 
            product_of_interest = ${prospect.productOfInterest || null}, 
            message = ${prospect.message}, 
            status = ${prospect.status}
        WHERE id = ${prospect.id}
    `;
    return prospect;
};

export const deleteProspect = async (id: string) => {
    await sql`DELETE FROM prospects WHERE id = ${id}`;
    return id;
};

// --- Users ---
export const createUser = async (user: Omit<User, 'id'>) => {
    const id = crypto.randomUUID();
    try {
        // Hash password with bcrypt (10 rounds)
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await sql`
            INSERT INTO users (id, email, role, name, company, password, details)
            VALUES (${id}, ${user.email}, ${user.role}, ${user.name}, ${user.company || null}, ${hashedPassword}, ${JSON.stringify(user.details || {})})
        `;
        return { ...user, id };
    } catch (e) {
        console.error("Error creating user:", e);
        throw e;
    }
};

export const updateUser = async (user: User) => {
    await sql`
        UPDATE users 
        SET email = ${user.email}, 
            role = ${user.role}, 
            name = ${user.name}, 
            company = ${user.company || null}, 
            details = ${JSON.stringify(user.details || {})}
        WHERE id = ${user.id}
    `;
    return user;
};

export const deleteUser = async (id: string) => {
    await sql`DELETE FROM users WHERE id = ${id}`;
    return id;
};

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
    try {
        // Get user by email only
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (users.length > 0) {
            const u = users[0];

            // Compare provided password with hashed password
            const isPasswordValid = await bcrypt.compare(pass, u.password);

            if (isPasswordValid) {
                return {
                    id: u.id,
                    email: u.email,
                    role: u.role,
                    name: u.name,
                    company: u.company,
                    details: u.details,
                    createdAt: u.created_at
                } as User;
            }
        }
        return null;
    } catch (e) {
        console.error("Login Error", e);
        return null;
    }
};

export const fetchUsers = async (): Promise<User[]> => {
    try {
        const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
        return users.map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            name: u.name,
            company: u.company,
            details: u.details,
            createdAt: u.created_at
        })) as User[];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

// --- Orders ---
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const id = crypto.randomUUID();
    await sql`
        INSERT INTO orders (id, user_id, user_name, items, total, status)
        VALUES (${id}, ${order.userId}, ${order.userName}, ${order.items}, ${order.total}, 'Pending')
    `;
    return { ...order, id, status: 'Pending', createdAt: new Date().toISOString() };
};

export const fetchOrders = async (): Promise<Order[]> => {
    try {
        const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
        return orders.map((o: any) => ({
            id: o.id,
            userId: o.user_id,
            userName: o.user_name,
            items: o.items, // Already JSON string or object depending on driver
            total: Number(o.total),
            status: o.status,
            createdAt: o.created_at
        })) as Order[];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};
