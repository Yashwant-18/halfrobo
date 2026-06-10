import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiZap, FiHeart, FiStar, FiTruck, FiShield, FiChevronRight, FiPlus, FiMinus, FiShare2 } from 'react-icons/fi';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/product/ProductCard';
import toast from 'react-hot-toast';
import './ProductDetailPage.css';

function ProductImage({ images, name }) {
  const [main, setMain] = useState(0);
  const list = Array.isArray(images) && images.length > 0 ? images : [];
  if (!list.length) return (
    <div className="pd__img-placeholder"><span style={{ fontSize: '8rem' }}>🤖</span><div className="pd__img-glow" /></div>
  );
  return (
    <div className="pd__gallery">
      <div className="pd__main-img-wrap"><img src={list[main]} alt={name} className="pd__main-img" onError={e => { e.target.style.display = 'none'; }} /></div>
      {list.length > 1 && (
        <div className="pd__thumbs">{list.map((img, i) => (
          <button key={i} className={`pd__thumb ${i === main ? 'pd__thumb--active' : ''}`} onClick={() => setMain(i)}>
            <img src={img} alt="" />
          </button>
        ))}</div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('specs');
  const [wishlisted, setWishlisted] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data.data);
      api.get(`/products?category=${r.data.data.category_slug}&limit=4`).then(rel => {
        setRelated((rel.data.data || []).filter(p => p.id !== id).slice(0, 4));
      }).catch(() => {});
    }).catch(() => toast.error('Product not found')).finally(() => setLoading(false));
    api.get(`/reviews/product/${id}`).then(r => setReviews(r.data.data || [])).catch(() => {});
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="pd__loading"><div className="spinner spinner-lg" /></div>;
  if (!product) return <div className="pd__loading"><h2>Product not found</h2></div>;

  const price = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const specs = typeof product.specifications === 'string' ? JSON.parse(product.specifications || '{}') : (product.specifications || {});

  return (
    <div className="pd page-enter">
      {/* Breadcrumb */}
      <div className="container pd__breadcrumb">
        <Link to="/">Home</Link><FiChevronRight size={12} /><Link to="/products">Products</Link><FiChevronRight size={12} />
        {product.category_name && <><Link to={`/products?category=${product.category_slug}`}>{product.category_name}</Link><FiChevronRight size={12} /></>}
        <span className="text-muted">{product.name}</span>
      </div>

      <div className="container pd__layout">
        {/* Left: Images */}
        <motion.div className="pd__images" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <ProductImage images={product.images} name={product.name} />
        </motion.div>

        {/* Right: Info */}
        <motion.div className="pd__info" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          {product.category_name && <span className="badge badge-blue">{product.category_name}</span>}
          <h1 className="pd__name">{product.name}</h1>

          <div className="pd__rating">
            {[1,2,3,4,5].map(s => <FiStar key={s} size={16} className={s <= Math.round(parseFloat(product.rating || 0)) ? 'star--filled' : 'star--empty'} />)}
            <span style={{ fontWeight: 700 }}>{parseFloat(product.rating || 0).toFixed(1)}</span>
            <span className="text-muted">({product.review_count || 0} reviews)</span>
          </div>

          <div className="pd__price-row">
            <span className="pd__price">₹{(discountPrice || price).toLocaleString('en-IN')}</span>
            {discountPrice && <span className="pd__original">₹{price.toLocaleString('en-IN')}</span>}
            {discount > 0 && <span className="badge badge-green">-{discount}% OFF</span>}
          </div>

          <div className="pd__stock-row">
            {product.stock > 10 && <span className="badge badge-green">✓ In Stock</span>}
            {product.stock > 0 && product.stock <= 10 && <span className="badge badge-pink">Only {product.stock} left!</span>}
            {product.stock === 0 && <span className="badge badge-pink">Out of Stock</span>}
            {product.sku && <span className="text-muted" style={{ fontSize: '0.8rem' }}>SKU: {product.sku}</span>}
          </div>

          <p className="pd__desc">{product.description}</p>

          <div className="pd__badges-row">
            {price >= 999 && <div className="pd__badge-item"><FiTruck size={16} /><span>Free Shipping</span></div>}
            <div className="pd__badge-item"><FiShield size={16} /><span>2-Year Warranty</span></div>
          </div>

          <div className="pd__actions">
            <div className="pd__qty">
              <button className="pd__qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
              <span className="pd__qty-val">{qty}</span>
              <button className="pd__qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}><FiPlus /></button>
            </div>
            <button className="btn btn-primary btn-lg pd__cart-btn" onClick={() => addToCart(product, qty)} disabled={!product.stock}>
              <FiShoppingCart /> Add to Cart
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => { addToCart(product, qty); window.location.href = '/checkout'; }} disabled={!product.stock}>
              <FiZap /> Buy Now
            </button>
          </div>

          <div className="pd__extra-actions">
            <button className={`pd__icon-btn ${wishlisted ? 'pd__icon-btn--active' : ''}`} onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? 'Removed' : '❤️ Added to wishlist'); }}>
              <FiHeart size={18} /> {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <button className="pd__icon-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
              <FiShare2 size={18} /> Share
            </button>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="container pd__tabs-section">
        <div className="pd__tabs">
          <button className={`pd__tab ${tab === 'specs' ? 'pd__tab--active' : ''}`} onClick={() => setTab('specs')}>Specifications</button>
          <button className={`pd__tab ${tab === 'reviews' ? 'pd__tab--active' : ''}`} onClick={() => setTab('reviews')}>Reviews ({reviews.length})</button>
        </div>
        <div className="pd__tab-content glass">
          {tab === 'specs' ? (
            Object.keys(specs).length > 0 ? (
              <table className="pd__specs-table">
                <tbody>{Object.entries(specs).map(([k, v]) => (
                  <tr key={k}><td className="pd__spec-key">{k.replace(/_/g, ' ')}</td><td className="pd__spec-val">{v}</td></tr>
                ))}</tbody>
              </table>
            ) : <p className="text-muted" style={{ padding: 24 }}>No specifications available.</p>
          ) : (
            reviews.length > 0 ? (
              <div className="pd__reviews">{reviews.map(r => (
                <div key={r.id} className="pd__review">
                  <div className="pd__review-avatar">{r.user_name?.[0]}</div>
                  <div className="pd__review-body">
                    <div className="pd__review-header">
                      <span className="pd__review-name">{r.user_name}</span>
                      <div className="pd__review-stars">{[1,2,3,4,5].map(s => <FiStar key={s} size={12} className={s <= r.rating ? 'star--filled' : 'star--empty'} />)}</div>
                    </div>
                    <p className="pd__review-text">{r.comment}</p>
                    <span className="pd__review-date">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}</div>
            ) : <p className="text-muted" style={{ padding: 24 }}>No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="container pd__related">
          <h2 className="heading-lg" style={{ marginBottom: 32 }}>Related <span className="text-gradient">Products</span></h2>
          <div className="grid-4">{related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
        </div>
      )}
    </div>
  );
}
