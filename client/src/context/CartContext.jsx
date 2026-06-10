import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const STORAGE_KEY = 'halfrobo_cart';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        toast.success('Cart updated!');
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      toast.success('Added to cart! 🛒');
      return [...prev, {
        id: `cart-${product.id}`,
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        discount_price: product.discount_price ? parseFloat(product.discount_price) : null,
        images: product.images || [],
        stock: product.stock,
        quantity,
        saved_for_later: false,
      }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Item removed');
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, []);

  const toggleSaveForLater = useCallback((id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, saved_for_later: !i.saved_for_later } : i));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.success('Cart cleared');
  }, []);

  const cartItems = items.filter(i => !i.saved_for_later);
  const savedItems = items.filter(i => i.saved_for_later);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = cartItems.reduce((sum, i) => {
    const price = i.discount_price || i.price;
    return sum + price * i.quantity;
  }, 0);

  const [coupon, setCoupon] = useState(null);
  const discountAmount = coupon ? parseFloat(coupon.discountAmount) : 0;
  const shipping = subtotal > 999 ? 0 : subtotal > 0 ? 99 : 0;
  const total = subtotal + shipping - discountAmount;

  const applyCoupon = (couponData, discountAmt) => {
    setCoupon({ ...couponData, discountAmount: discountAmt });
    toast.success(`Coupon applied! Saved ₹${discountAmt}`);
  };
  const removeCoupon = () => { setCoupon(null); toast.success('Coupon removed'); };

  return (
    <CartContext.Provider value={{
      items, cartItems, savedItems, itemCount, subtotal, shipping, discountAmount, total,
      coupon, applyCoupon, removeCoupon,
      addToCart, removeFromCart, updateQuantity, toggleSaveForLater, clearCart,
      isOpen, setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
