import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiZap, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './ProductCard.css';
import toast from 'react-hot-toast';

function getDiscount(price, discountPrice) {
  if (!discountPrice) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

function ProductImage({ images, name }) {
  const [imgError, setImgError] = useState(false);
  const src = Array.isArray(images) && images.length > 0 ? images[0] : null;
  if (!src || imgError) {
    return (
      <div className="product-card__img-placeholder">
        <span className="product-card__img-emoji">🤖</span>
        <div className="product-card__img-bg" />
      </div>
    );
  }
  return <img src={src} alt={name} className="product-card__img" onError={() => setImgError(true)} />;
}

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, setIsOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const price = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const discount = getDiscount(price, discountPrice);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingCart(true);
    addToCart(product, 1);
    setTimeout(() => setAddingCart(false), 1000);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    toast.success(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist');
  };

  return (
    <motion.div
      className="product-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <Link to={`/products/${product.id}`} className="product-card__inner">
        {/* Image */}
        <div className="product-card__image-wrap">
          <ProductImage images={product.images} name={product.name} />
          <div className="product-card__overlay" />

          {/* Badges */}
          <div className="product-card__badges">
            {discount > 0 && <span className="product-card__badge product-card__badge--discount">-{discount}%</span>}
            {product.is_featured && <span className="product-card__badge product-card__badge--featured">⭐ Featured</span>}
            {product.stock <= 5 && product.stock > 0 && <span className="product-card__badge product-card__badge--low">Low Stock</span>}
            {product.stock === 0 && <span className="product-card__badge product-card__badge--out">Out of Stock</span>}
          </div>

          {/* Wishlist */}
          <button className={`product-card__wish ${wishlisted ? 'product-card__wish--active' : ''}`} onClick={handleWishlist} title="Add to wishlist">
            <FiHeart size={16} />
          </button>

          {/* Quick actions (appear on hover) */}
          <div className="product-card__quick">
            <button className="product-card__quick-btn" onClick={handleBuyNow} disabled={product.stock === 0}>
              <FiZap size={15} /> Buy Now
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="product-card__info">
          {product.category_name && (
            <span className="product-card__category">{product.category_name}</span>
          )}
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__desc">{product.description?.substring(0, 80)}...</p>

          {/* Rating */}
          <div className="product-card__rating">
            {[1,2,3,4,5].map(s => (
              <FiStar key={s} size={13} className={s <= Math.round(parseFloat(product.rating || 0)) ? 'star--filled' : 'star--empty'} />
            ))}
            <span className="product-card__rating-val">{parseFloat(product.rating || 0).toFixed(1)}</span>
            <span className="product-card__review-count">({product.review_count || 0})</span>
          </div>

          {/* Price */}
          <div className="product-card__price-row">
            <span className="product-card__price">
              ₹{(discountPrice || price).toLocaleString('en-IN')}
            </span>
            {discountPrice && (
              <span className="product-card__original">₹{price.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="product-card__actions">
          <button
            className={`btn btn-primary product-card__cart-btn ${addingCart ? 'product-card__cart-btn--added' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingCart}
          >
            <FiShoppingCart size={15} />
            {addingCart ? 'Added!' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
