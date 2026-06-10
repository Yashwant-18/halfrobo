import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiHome, FiArrowRight, FiCheck } from 'react-icons/fi';
import './OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const order = state?.order;
  if (!order) return <Navigate to="/" replace />;

  return (
    <div className="confirm-page page-enter">
      <div className="confirm-page__bg" />
      <div className="container confirm-page__inner">
        {/* Success animation */}
        <motion.div className="confirm-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, stiffness: 150 }}>
          <div className="confirm-check__circle"><FiCheck size={48} /></div>
        </motion.div>

        <motion.div className="confirm-content glass" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="confirm-badge">🎉 Order Placed Successfully!</div>
          <h1 className="heading-xl" style={{ margin: '16px 0 8px' }}>
            Order <span className="text-gradient">#{order.order_number}</span>
          </h1>
          <p className="text-secondary" style={{ fontSize: '1rem', marginBottom: 32 }}>
            Thank you for your purchase! We'll process your order within 24 hours.
          </p>

          <div className="confirm-details">
            <div className="confirm-detail-card glass">
              <div className="confirm-detail-label">Estimated Delivery</div>
              <div className="confirm-detail-value">{order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '5–7 Business Days'}</div>
            </div>
            <div className="confirm-detail-card glass">
              <div className="confirm-detail-label">Payment Method</div>
              <div className="confirm-detail-value">{order.payment_method?.replace('_', ' ')?.toUpperCase()}</div>
            </div>
            <div className="confirm-detail-card glass">
              <div className="confirm-detail-label">Order Total</div>
              <div className="confirm-detail-value text-gradient">₹{parseFloat(order.total).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="confirm-address glass">
              <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Shipping To</h4>
              <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                {order.shipping_address.name}<br />
                {order.shipping_address.address_line1}, {order.shipping_address.address_line2 && `${order.shipping_address.address_line2}, `}
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zip}
              </p>
            </div>
          )}

          <div className="confirm-actions">
            <Link to="/dashboard/orders" className="btn btn-primary btn-lg"><FiPackage /> View My Orders</Link>
            <Link to="/products" className="btn btn-secondary btn-lg"><FiHome /> Continue Shopping <FiArrowRight /></Link>
          </div>

          <div className="confirm-share">
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Share your purchase:</p>
            <div className="confirm-share-text glass">
              "Just ordered the most amazing AI robot from @HalfRobo! 🤖 The future is here. #HalfRobo #AIRobotics"
            </div>
          </div>
        </motion.div>

        {/* Decorative particles */}
        <div className="confirm-confetti">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="confirm-confetti__dot" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, background: i % 3 === 0 ? 'var(--neon-blue)' : i % 3 === 1 ? 'var(--neon-purple)' : 'var(--neon-green)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
