import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant } from './types';

export interface CartItem extends Product {
    quantity: number;
    selectedVariantId?: string;
    cartId: string; // Composite ID to distinguish variants
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
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

    // Load cart from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('ig_cart');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing cart", e);
            }
        }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('ig_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Product, quantity: number = 1, selectedVariant?: ProductVariant) => {
        setItems(current => {
            const variantId = selectedVariant?.id || 'default';
            const cartId = `${product.id}-${variantId}`;

            const existing = current.find(item => item.cartId === cartId);

            if (existing) {
                return current.map(item =>
                    item.cartId === cartId ? { ...item, quantity: item.quantity + quantity } : item
                );
            }

            const newItem: CartItem = {
                ...product,
                quantity,
                selectedVariantId: selectedVariant?.id,
                cartId,
                // Override main product size/price with variant values if selected
                size: selectedVariant?.size || product.size,
                price: selectedVariant?.price || product.price
            };

            return [...current, newItem];
        });
        setIsOpen(true);
    };

    const removeFromCart = (cartId: string) => {
        setItems(current => current.filter(item => item.cartId !== cartId));
    };

    const updateQuantity = (cartId: string, quantity: number) => {
        if (quantity < 1) return removeFromCart(cartId);
        setItems(current =>
            current.map(item =>
                item.cartId === cartId ? { ...item, quantity } : item
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
