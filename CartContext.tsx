import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from './types';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    total: 0,
    isOpen: false,
    setIsOpen: () => { },
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load cart from localStorage on mount (optional persistence)
    useEffect(() => {
        const saved = localStorage.getItem('ig_cart');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('ig_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Product, quantity: number = 1) => {
        setItems(current => {
            const existing = current.find(item => item.id === product.id);
            if (existing) {
                return current.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...current, { ...product, quantity }];
        });
        setIsOpen(true);
    };

    const removeFromCart = (productId: string) => {
        setItems(current => current.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return removeFromCart(productId);
        setItems(current =>
            current.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, isOpen, setIsOpen }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
