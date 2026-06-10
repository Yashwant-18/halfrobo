import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiCreditCard, FiCheckCircle, FiTruck,
  FiZap, FiStar, FiShield, FiChevronRight, FiChevronLeft,
  FiPackage, FiSmartphone, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './CheckoutPage.css';

const STEPS = [
  { id: 1, label: 'Shipping', icon: FiMapPin },
  { id: 2, label: 'Payment', icon: FiCreditCard },
  { id: 3, label: 'Review', icon: FiCheckCircle },
];

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', duration: '5–7 Business Days', price: 0, icon: FiTruck },
  { id: 'express', label: 'Express Delivery', duration: '1–2 Business Days', price: 199, icon: FiZap },
  { id: 'overnight', label: 'Overnight Delivery', duration: 'Next Day by 10 AM', price: 499, icon: FiStar },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: FiCreditCard },
  { id: 'upi', label: 'UPI', icon: FiSmartphone },
  { id: 'netbanking', label: 'Net Banking', icon: FiShield },
  { id: 'cod', label: 'Cash on Delivery', icon: FiPackage },
];

const initialShipping = {
  name: '', phone: '', address1: '', address2: '',
  city: '', state: '', zip: '', country: 'India',
};

const initialCard = { number: '', expiry: '', cvv: '', name: '' };

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cartItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState(initialShipping);
  const [delivery, setDelivery] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [card, setCard] = useState(initialCard);
  const [upiId, setUpiId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  if (authLoading) return (
    <div className="checkout-loading">
      <div className="spinner spinner-lg" />
    </div>
  );
  if (!user) return <Navigate to="/login?redirect=/checkout" replace />;
  if (cartItems.length === 0) return <Navigate to="/cart" replace />;

  const deliveryOption = DELIVERY_OPTIONS.find(d => d.id === delivery);
  const deliveryFee = deliveryOption?.price ?? 0;
  const orderTotal = subtotal + deliveryFee;

  /* ── Validation ── */
  const validateShipping = () => {
    const e = {};
    if (!shipping.name.trim()) e.name = 'Full name is required';
    if (!shipping.phone.trim() || !/^\d{10}$/.test(shipping.phone.trim())) e.phone = 'Valid 10-digit phone required';
    if (!shipping.address1.trim()) e.address1 = 'Address is required';
    if (!shipping.city.trim()) e.city = 'City is required';
    if (!shipping.state.trim()) e.state = 'State is required';
    if (!shipping.zip.trim() || !/^\d{6}$/.test(shipping.zip.trim())) e.zip = 'Valid 6-digit PIN required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e = {};
    if (paymentMethod === 'card') {
      if (!card.number.replace(/\s/g, '') || card.number.replace(/\s/g, '').length < 16) e.cardNumber = 'Valid card number required';
      if (!card.expiry || !/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'Use MM/YY format';
      if (!card.cvv || card.cvv.length < 3) e.cvv = 'Valid CVV required';
      if (!card.name.trim()) e.cardName = 'Name on card required';
    }
    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) e.upiId = 'Valid UPI ID required (e.g. name@upi)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateShipping()) return;
    if (step === 2 && !validatePayment()) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleShippingChange = (field, val) => {
    setShipping(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleCardChange = (field, val) => {
    let formatted = val;
    if (field === 'number') {
      formatted = val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    }
    if (field === 'expiry') {
      formatted = val.replace(/\D/g, '').slice(0, 4);
      if (formatted.length >= 3) formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }
    if (field === 'cvv') {
      formatted = val.replace(/\D/g, '').slice(0, 4);
    }
    setCard(prev => ({ ...prev, [field]: formatted }));
    if (errors[field === 'number' ? 'cardNumber' : field === 'name' ? 'cardName' : field]) {
      setErrors(prev => ({ ...prev, [field === 'number' ? 'cardNumber' : field === 'name' ? 'cardName' : field]: '' }));
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderData = {
        items: cartItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.discount_price || i.price,
          name: i.name,
        })),
        shipping_address: shipping,
        delivery_method: delivery,
        payment_method: paymentMethod,
        subtotal,
        delivery_fee: deliveryFee,
        total: orderTotal,
      };
      const res = await api.post('/orders', orderData);
      clearCart();
      navigate('/order-confirmation', {
        replace: true,
        state: { order: res.data.data || res.data, orderData },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Order placement failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  /* ── Render helpers ── */
  const renderField = (label, field, type = 'text', placeholder = '', span = false) => (
    <div className={`form-group${span ? ' co-span' : ''}`} key={field}>
      <label className="form-label">{label}</label>
      <input
        className={`form-input${errors[field] ? ' input-error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={shipping[field]}
        onChange={e => handleShippingChange(field, e.target.value)}
      />
      {errors[field] && <span className="form-error"><FiAlertCircle size={12} /> {errors[field]}</span>}
    </div>
  );

  return (
    <div className="checkout-page">
      {/* Step Indicator */}
      <div className="co-step-bar">
        <div className="container">
          <div className="co-steps">
            {STEPS.map((s, idx) => (
              <div key={s.id} className={`co-step ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
                <div className="co-step-circle">
                  {step > s.id ? <FiCheckCircle size={16} /> : <s.icon size={16} />}
                </div>
                <span className="co-step-label">{s.label}</span>
                {idx < STEPS.length - 1 && <div className="co-step-line" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="co-layout">
          {/* Main Content */}
          <div className="co-main">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Shipping ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="co-card glass"
                >
                  <div className="co-card-header">
                    <FiMapPin className="co-card-icon" />
                    <h2 className="co-card-title">Shipping Address</h2>
                  </div>
                  <div className="co-form-grid">
                    {renderField('Full Name', 'name', 'text', 'John Doe')}
                    {renderField('Phone Number', 'phone', 'tel', '9876543210')}
                    {renderField('Address Line 1', 'address1', 'text', 'Street, Building, etc.', true)}
                    {renderField('Address Line 2 (Optional)', 'address2', 'text', 'Apartment, floor, landmark', true)}
                    {renderField('City', 'city', 'text', 'Mumbai')}
                    {renderField('State', 'state', 'text', 'Maharashtra')}
                    {renderField('PIN Code', 'zip', 'text', '400001')}
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        value={shipping.country}
                        onChange={e => handleShippingChange('country', e.target.value)}
                      >
                        <option value="India">India</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="UAE">UAE</option>
                        <option value="Singapore">Singapore</option>
                      </select>
                    </div>
                  </div>

                  <div className="co-section-label">Delivery Method</div>
                  <div className="co-delivery-options">
                    {DELIVERY_OPTIONS.map(opt => (
                      <label key={opt.id} className={`co-delivery-opt${delivery === opt.id ? ' selected' : ''}`}>
                        <input
                          type="radio"
                          name="delivery"
                          value={opt.id}
                          checked={delivery === opt.id}
                          onChange={() => setDelivery(opt.id)}
                        />
                        <opt.icon size={20} className="co-del-icon" />
                        <div className="co-del-info">
                          <span className="co-del-label">{opt.label}</span>
                          <span className="co-del-dur">{opt.duration}</span>
                        </div>
                        <span className="co-del-price">
                          {opt.price === 0 ? <span className="co-free">FREE</span> : `₹${opt.price}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Payment ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="co-card glass"
                >
                  <div className="co-card-header">
                    <FiCreditCard className="co-card-icon" />
                    <h2 className="co-card-title">Payment Method</h2>
                    <div className="co-secure-badge">
                      <FiShield size={12} />
                      <span>Secure Payment</span>
                    </div>
                  </div>

                  {/* Method Tabs */}
                  <div className="co-payment-tabs">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.id}
                        className={`co-pay-tab${paymentMethod === m.id ? ' active' : ''}`}
                        onClick={() => { setPaymentMethod(m.id); setErrors({}); }}
                      >
                        <m.icon size={18} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {paymentMethod === 'card' && (
                      <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="co-pay-fields">
                        <div className="co-card-visual">
                          <div className="co-card-chip" />
                          <div className="co-card-num-display">
                            {card.number || '•••• •••• •••• ••••'}
                          </div>
                          <div className="co-card-bottom">
                            <span>{card.name || 'CARD HOLDER'}</span>
                            <span>{card.expiry || 'MM/YY'}</span>
                          </div>
                        </div>
                        <div className="co-form-grid">
                          <div className="form-group co-span">
                            <label className="form-label">Card Number</label>
                            <input className={`form-input${errors.cardNumber ? ' input-error' : ''}`} placeholder="1234 5678 9012 3456" value={card.number} onChange={e => handleCardChange('number', e.target.value)} />
                            {errors.cardNumber && <span className="form-error"><FiAlertCircle size={12} /> {errors.cardNumber}</span>}
                          </div>
                          <div className="form-group co-span">
                            <label className="form-label">Name on Card</label>
                            <input className={`form-input${errors.cardName ? ' input-error' : ''}`} placeholder="John Doe" value={card.name} onChange={e => handleCardChange('name', e.target.value)} />
                            {errors.cardName && <span className="form-error"><FiAlertCircle size={12} /> {errors.cardName}</span>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">Expiry Date</label>
                            <input className={`form-input${errors.expiry ? ' input-error' : ''}`} placeholder="MM/YY" value={card.expiry} onChange={e => handleCardChange('expiry', e.target.value)} />
                            {errors.expiry && <span className="form-error"><FiAlertCircle size={12} /> {errors.expiry}</span>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">CVV</label>
                            <input className={`form-input${errors.cvv ? ' input-error' : ''}`} placeholder="•••" type="password" maxLength={4} value={card.cvv} onChange={e => handleCardChange('cvv', e.target.value)} />
                            {errors.cvv && <span className="form-error"><FiAlertCircle size={12} /> {errors.cvv}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'upi' && (
                      <motion.div key="upi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="co-pay-fields">
                        <div className="co-upi-logos">
                          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(u => (
                            <div key={u} className="co-upi-badge">{u}</div>
                          ))}
                        </div>
                        <div className="form-group">
                          <label className="form-label">UPI ID</label>
                          <input
                            className={`form-input${errors.upiId ? ' input-error' : ''}`}
                            placeholder="yourname@upi"
                            value={upiId}
                            onChange={e => { setUpiId(e.target.value); if (errors.upiId) setErrors(p => ({ ...p, upiId: '' })); }}
                          />
                          {errors.upiId && <span className="form-error"><FiAlertCircle size={12} /> {errors.upiId}</span>}
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <motion.div key="nb" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="co-pay-fields">
                        <div className="co-nb-info glass">
                          <FiShield size={24} className="co-nb-icon" />
                          <div>
                            <p className="co-nb-title">Net Banking</p>
                            <p className="co-nb-desc">You will be redirected to your bank's secure portal to complete the payment after placing the order.</p>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Select Bank</label>
                          <select className="form-select">
                            <option>State Bank of India</option>
                            <option>HDFC Bank</option>
                            <option>ICICI Bank</option>
                            <option>Axis Bank</option>
                            <option>Kotak Mahindra Bank</option>
                            <option>Other Banks</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'cod' && (
                      <motion.div key="cod" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="co-pay-fields">
                        <div className="co-cod-info glass">
                          <FiPackage size={32} className="co-cod-icon" />
                          <p className="co-cod-title">Cash on Delivery</p>
                          <p className="co-cod-desc">Pay with cash when your order is delivered. Additional ₹49 COD fee may apply.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Step 3: Review ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="co-card glass"
                >
                  <div className="co-card-header">
                    <FiCheckCircle className="co-card-icon" />
                    <h2 className="co-card-title">Review Order</h2>
                  </div>

                  {/* Items */}
                  <div className="co-section-label">Items ({cartItems.length})</div>
                  <div className="co-review-items">
                    {cartItems.map(item => {
                      const price = item.discount_price || item.price;
                      return (
                        <div key={item.id} className="co-review-item">
                          <div className="co-review-img">
                            {item.images?.[0]
                              ? <img src={item.images[0]} alt={item.name} />
                              : <div className="co-img-placeholder"><FiPackage size={20} /></div>}
                          </div>
                          <div className="co-review-item-info">
                            <p className="co-review-item-name">{item.name}</p>
                            <p className="co-review-item-qty">Qty: {item.quantity}</p>
                          </div>
                          <span className="co-review-item-price">₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipping Summary */}
                  <div className="co-section-label">Shipping Details</div>
                  <div className="co-review-summary glass">
                    <p className="co-sum-name">{shipping.name}</p>
                    <p className="co-sum-detail">{shipping.phone}</p>
                    <p className="co-sum-detail">{shipping.address1}{shipping.address2 ? `, ${shipping.address2}` : ''}</p>
                    <p className="co-sum-detail">{shipping.city}, {shipping.state} – {shipping.zip}</p>
                    <p className="co-sum-detail">{shipping.country}</p>
                    <div className="co-sum-delivery">
                      <deliveryOption.icon size={14} />
                      <span>{deliveryOption.label} — {deliveryOption.duration}</span>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="co-section-label">Payment Method</div>
                  <div className="co-review-summary glass">
                    {(() => {
                      const pm = PAYMENT_METHODS.find(m => m.id === paymentMethod);
                      return (
                        <div className="co-pay-sum">
                          <pm.icon size={18} />
                          <span>{pm.label}</span>
                          {paymentMethod === 'card' && card.number && (
                            <span className="co-pay-last4">ending in {card.number.replace(/\s/g, '').slice(-4)}</span>
                          )}
                          {paymentMethod === 'upi' && <span className="co-pay-last4">{upiId}</span>}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="co-nav-btns">
              {step > 1 && (
                <button className="btn btn-ghost" onClick={handleBack} disabled={placing}>
                  <FiChevronLeft size={18} /> Back
                </button>
              )}
              {step < 3 && (
                <button className="btn btn-primary co-next-btn" onClick={handleNext}>
                  Continue <FiChevronRight size={18} />
                </button>
              )}
              {step === 3 && (
                <button
                  className="btn btn-primary co-place-btn"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Placing Order…</>
                  ) : (
                    <><FiCheckCircle size={18} /> Place Order — ₹{orderTotal.toLocaleString('en-IN')}</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="co-sidebar">
            <div className="co-summary-card glass">
              <h3 className="co-sum-title">Order Summary</h3>
              <div className="co-sum-items">
                {cartItems.map(item => {
                  const price = item.discount_price || item.price;
                  return (
                    <div key={item.id} className="co-sum-row">
                      <span className="co-sum-item-name">
                        {item.name.length > 22 ? item.name.slice(0, 22) + '…' : item.name}
                        <span className="co-sum-item-qty"> ×{item.quantity}</span>
                      </span>
                      <span>₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
              <div className="divider" />
              <div className="co-sum-line">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="co-sum-line">
                <span>Delivery ({deliveryOption?.label})</span>
                <span>{deliveryFee === 0 ? <span className="co-free">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              <div className="divider" />
              <div className="co-sum-total">
                <span>Total</span>
                <span className="co-total-amt">₹{orderTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="co-trust-badges">
                <div className="co-trust-item"><FiShield size={14} /> Secure checkout</div>
                <div className="co-trust-item"><FiTruck size={14} /> Fast delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
