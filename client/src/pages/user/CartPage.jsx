import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiTrash2, FiPlus, FiMinus, FiArrowRight, FiTag } from 'react-icons/fi';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './CartPage.css';

function CartItemRow({ item, updateQuantity, removeFromCart, toggleSaveForLater }) {
  const price = item.discount_price || item.price;
  const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  return (
    <div className="cart-row glass">
      <div className="cart-row__img-wrap">
        {img ? <img src={img} alt={item.name} className="cart-row__img" onError={e => e.target.style.display='none'} /> : <div className="cart-row__img-ph">🤖</div>}
      </div>
      <div className="cart-row__info">
        <Link to={`/products/${item.product_id}`} className="cart-row__name">{item.name}</Link>
        <div className="cart-row__price-row">
          <span className="cart-row__price">₹{price.toLocaleString('en-IN')}</span>
          {item.discount_price && <span className="cart-row__original">₹{item.price.toLocaleString('en-IN')}</span>}
        </div>
      </div>
      <div className="cart-row__qty">
        <button className="cart-row__qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><FiMinus size={12} /></button>
        <span>{item.quantity}</span>
        <button className="cart-row__qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}><FiPlus size={12} /></button>
      </div>
      <div className="cart-row__subtotal">₹{(price * item.quantity).toLocaleString('en-IN')}</div>
      <div className="cart-row__actions">
        <button className="cart-row__save" onClick={() => toggleSaveForLater(item.id)}>Save for Later</button>
        <button className="cart-row__remove" onClick={() => removeFromCart(item.id)}><FiTrash2 size={15} /></button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cartItems, savedItems, itemCount, subtotal, shipping, discountAmount, total, coupon, applyCoupon, removeCoupon, removeFromCart, updateQuantity, toggleSaveForLater, clearCart } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', { code: couponInput, orderTotal: subtotal });
      applyCoupon(res.data.data.coupon, res.data.data.discountAmount);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  if (cartItems.length === 0 && savedItems.length === 0) return (
    <div className="cart-empty">
      <motion.div className="cart-empty__inner glass" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ fontSize: '5rem', marginBottom: 16 }}>🛒</div>
        <h2 className="heading-lg">Your cart is empty</h2>
        <p className="text-secondary" style={{ marginTop: 8 }}>Add some amazing robots and gadgets!</p>
        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 28 }}><FiShoppingBag /> Start Shopping</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="cart-page page-enter">
      <div className="container">
        <div className="cart-page__header">
          <h1 className="heading-xl">Shopping <span className="text-gradient">Cart</span></h1>
          {itemCount > 0 && <button className="btn btn-ghost btn-sm" onClick={clearCart}><FiTrash2 /> Clear Cart</button>}
        </div>

        <div className="cart-page__layout">
          {/* Items */}
          <div className="cart-page__items">
            {/* Column headers */}
            <div className="cart-page__header-row">
              <span>Product</span><span></span><span>Qty</span><span>Total</span><span></span>
            </div>
            {cartItems.map(item => (
              <CartItemRow key={item.id} item={item} updateQuantity={updateQuantity} removeFromCart={removeFromCart} toggleSaveForLater={toggleSaveForLater} />
            ))}

            {savedItems.length > 0 && (
              <div className="cart-page__saved">
                <h3 className="cart-page__saved-title">Saved for Later ({savedItems.length})</h3>
                {savedItems.map(item => <CartItemRow key={item.id} item={item} updateQuantity={updateQuantity} removeFromCart={removeFromCart} toggleSaveForLater={toggleSaveForLater} />)}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="cart-page__summary glass">
            <h3 className="cart-summary__title">Order Summary</h3>
            <div className="cart-summary__rows">
              <div className="cart-summary__row"><span>Subtotal ({itemCount} items)</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="cart-summary__row"><span>Shipping</span><span style={{ color: shipping === 0 ? 'var(--neon-green)' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              {discountAmount > 0 && <div className="cart-summary__row" style={{ color: 'var(--neon-green)' }}><span>Discount</span><span>-₹{discountAmount}</span></div>}
              {shipping === 0 && subtotal > 0 && <p className="cart-summary__free-ship">🎉 You qualify for free shipping!</p>}
              {subtotal > 0 && subtotal < 999 && <p className="cart-summary__ship-hint">Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping</p>}
            </div>
            <div className="cart-summary__divider" />
            <div className="cart-summary__total"><span>Total</span><span className="text-gradient">₹{total.toLocaleString('en-IN')}</span></div>

            {/* Coupon */}
            <div className="cart-summary__coupon">
              <label className="form-label"><FiTag size={13} /> Coupon Code</label>
              {coupon ? (
                <div className="cart-summary__coupon-applied">
                  <span className="badge badge-green">✓ {coupon.code}</span>
                  <button className="btn btn-ghost btn-sm" onClick={removeCoupon}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="WELCOME10" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleCoupon()} />
                  <button className="btn btn-secondary btn-sm" onClick={handleCoupon} disabled={couponLoading}>{couponLoading ? '...' : 'Apply'}</button>
                </div>
              )}
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Try: WELCOME10, ROBO20, HALFROBO50</p>
            </div>

            <button className="btn btn-primary full-width btn-lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout <FiArrowRight />
            </button>
            <Link to="/products" className="btn btn-ghost full-width" style={{ marginTop: 8, textAlign: 'center' }}>← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
