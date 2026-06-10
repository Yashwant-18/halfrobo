import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import api from '../../utils/api';
import ProductCard from '../../components/product/ProductCard';
import './ProductsPage.css';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
];

// Debounce hook — delays value update until user stops typing
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sort:     'newest',
    page:     1,
  });

  // Debounce search so we don't fire a request on every keystroke
  const debouncedSearch = useDebounce(filters.search, 400);

  // The actual filter values used for fetching (search uses debounced version)
  const fetchFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch,
  }), [filters, debouncedSearch]);

  // Fetch categories once
  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  // Fetch products whenever fetchFilters changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fetchFilters.search)   params.set('search',   fetchFilters.search);
    if (fetchFilters.category) params.set('category', fetchFilters.category);
    if (fetchFilters.minPrice) params.set('minPrice', fetchFilters.minPrice);
    if (fetchFilters.maxPrice) params.set('maxPrice', fetchFilters.maxPrice);
    params.set('sort',  fetchFilters.sort);
    params.set('page',  fetchFilters.page);
    params.set('limit', 12);

    api.get(`/products?${params}`)
      .then(r => {
        setProducts(r.data.data || []);
        setTotal(r.data.total || 0);
        setTotalPages(r.data.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [fetchFilters]);

  const setFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 });
  }, []);

  const setPage = useCallback((pg) => {
    setFilters(f => ({ ...f, page: pg }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="products-page">
      {/* Hero Header */}
      <div className="products-page__hero">
        <div className="products-page__hero-bg" />
        <div className="container">
          <motion.h1
            className="heading-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            All <span className="text-gradient">Products</span>
          </motion.h1>
          <motion.p
            className="text-secondary"
            style={{ marginTop: 12 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {total > 0
              ? `${total} products found`
              : 'Discover our complete catalog of AI-powered robotics & IoT devices'}
          </motion.p>
        </div>
      </div>

      <div className="container products-page__layout">
        {/* Mobile filter toggle */}
        <button
          className="products-page__filter-toggle btn btn-secondary btn-sm"
          onClick={() => setSidebarOpen(true)}
        >
          <FiFilter /> Filters
        </button>

        {sidebarOpen && (
          <div className="products-page__overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`products-page__sidebar glass ${sidebarOpen ? 'products-page__sidebar--open' : ''}`}>
          <div className="sidebar__header">
            <h3 className="sidebar__title">Filters</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear All</button>
              <button
                className="btn btn-ghost btn-sm products-page__sidebar-close"
                onClick={() => setSidebarOpen(false)}
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="sidebar__section">
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search products..."
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
              />
              {filters.search && (
                <button
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => setFilter('search', '')}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="sidebar__section">
            <label className="form-label">Category</label>
            <div className="sidebar__cat-list">
              <button
                className={`sidebar__cat-btn ${!filters.category ? 'sidebar__cat-btn--active' : ''}`}
                onClick={() => setFilter('category', '')}
              >
                All Products
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  className={`sidebar__cat-btn ${filters.category === c.slug ? 'sidebar__cat-btn--active' : ''}`}
                  onClick={() => setFilter('category', c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="sidebar__section">
            <label className="form-label">Price Range (₹)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="form-input" type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} />
              <input className="form-input" type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} />
            </div>
          </div>

          {/* Sort */}
          <div className="sidebar__section">
            <label className="form-label">Sort By</label>
            <div style={{ position: 'relative' }}>
              <select className="form-select" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FiChevronDown style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="products-page__main">
          {/* Top bar */}
          <div className="products-page__topbar">
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
              {loading ? 'Loading...' : `${total} products`}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Sort:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                value={filters.sort}
                onChange={e => setFilter('sort', e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="products-page__grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 420, borderRadius: 16 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="products-page__empty glass">
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
              <h3 className="heading-md">No products found</h3>
              <p className="text-secondary" style={{ marginTop: 8 }}>
                Try adjusting your filters or search term.
              </p>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="products-page__grid">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="products-page__pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={filters.page <= 1}
                onClick={() => setPage(filters.page - 1)}
              >
                ← Prev
              </button>

              {(() => {
                // Smart pagination: show first, last, current ± 2
                const pages = new Set([1, totalPages]);
                for (let i = Math.max(1, filters.page - 2); i <= Math.min(totalPages, filters.page + 2); i++) {
                  pages.add(i);
                }
                return [...pages].sort((a, b) => a - b).map((pg, idx, arr) => (
                  <>
                    {idx > 0 && arr[idx - 1] !== pg - 1 && (
                      <span key={`ellipsis-${pg}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                    )}
                    <button
                      key={pg}
                      className={`btn btn-sm ${filters.page === pg ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  </>
                ));
              })()}

              <button
                className="btn btn-ghost btn-sm"
                disabled={filters.page >= totalPages}
                onClick={() => setPage(filters.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
