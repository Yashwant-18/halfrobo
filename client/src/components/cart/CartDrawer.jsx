import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiShoppingBag, FiArrowRight, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './CartDrawer.css';

function ProductImg({ images, name }) {
  const src = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return src ? (
    <img src={src} alt={name} className="cart-item__img" onError={e => { e.target.style.display='none'; }} />
  ) : (
    <div className="cart-item__img cart-item__img--placeholder">🤖</div>
  );
}

export default function CartDrawer() {
  const { cartItems, savedItems, isOpen, setIsOpen, removeFromCart, updateQuantity, toggleSaveForLater, clearCart, subtotal, shipping, discountAmount, total, itemCount } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="cart-overlay" onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="cart-drawer glass"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            {/* Header */}
            <div className="cart-drawer__header">
              <div>
                <h2 className="cart-drawer__title">Shopping Cart</h2>
                {itemCount > 0 && <span className="cart-drawer__count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {cartItems.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={clearCart} title="Clear cart">
                    <FiTrash2 size={15} />
                  </button>
                )}
                <button className="cart-drawer__close" onClick={() => setIsOpen(false)}>
                  <FiX size={22} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="cart-drawer__body">
              {cartItems.length === 0 ? (
                <div className="cart-drawer__empty">
                  <div className="cart-drawer__empty-icon">🛒</div>
                  <p className="heading-md">Your cart is empty</p>
                  <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.9rem' }}>Add some amazing robots!</p>
                  <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => { setIsOpen(false); navigate('/products'); }}>
                    <FiShoppingBag size={16} /> Browse Products
                  </button>
                </div>
              ) : (
                <div className="cart-drawer__items">
                  {cartItems.map(item => (
                    <motion.div key={item.id} className="cart-item glass" layout
                      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0 }}
                    >
                      <ProductImg images={item.images} name={item.name} />
                      <div className="cart-item__info">
                        <p className="cart-item__name">{item.name}</p>
                        <div className="cart-item__price-row">
                          <span className="cart-item__price">
                            ₹{((item.discount_price || item.price) * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {item.discount_price && (
                            <span className="cart-item__original">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        <div className="cart-item__actions">
                          <div className="cart-item__qty">
                            <button className="cart-item__qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><FiMinus size={12} /></button>
                            <span>{item.quantity}</span>
                            <button className="cart-item__qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}><FiPlus size={12} /></button>
                          </div>
                          <button className="cart-item__save" onClick={() => toggleSaveForLater(item.id)}>Save</button>
                          <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}><FiTrash2 size={14} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {savedItems.length > 0 && (
                <div className="cart-drawer__saved">
                  <h4 className="cart-drawer__saved-title">Saved for Later ({savedItems.length})</h4>
                  {savedItems.map(item => (
                    <div key={item.id} className="cart-item cart-item--saved glass">
                      <ProductImg images={item.images} name={item.name} />
                      <div className="cart-item__info">
                        <p className="cart-item__name">{item.name}</p>
                        <p className="cart-item__price">₹{(item.discount_price || item.price).toLocaleString('en-IN')}</p>
                        <div className="cart-item__actions">
                          <button className="cart-item__save" onClick={() => toggleSaveForLater(item.id)}>Move to Cart</button>
                          <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}><FiTrash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with totals */}
            {cartItems.length > 0 && (
              <div className="cart-drawer__footer">
                <div className="cart-drawer__summary">
                  <div className="cart-drawer__summary-row">
                    <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="cart-drawer__summary-row">
                    <span>Shipping</span>
                    <span style={{ color: shipping === 0 ? 'var(--neon-green)' : 'inherit' }}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="cart-drawer__summary-row" style={{ color: 'var(--neon-green)' }}>
                      <span>Discount</span><span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {shipping === 0 && subtotal > 0 && <p className="cart-drawer__free-shipping">🎉 Free shipping applied!</p>}
                  <div className="cart-drawer__summary-row cart-drawer__summary-row--total">
                    <span>Total</span><span className="text-gradient">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button className="btn btn-primary full-width btn-lg" onClick={goCheckout}>
                  Proceed to Checkout <FiArrowRight size={18} />
                </button>
                <button className="btn btn-ghost full-width" style={{ marginTop: 8 }} onClick={() => { setIsOpen(false); navigate('/cart'); }}>
                  View Full Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
