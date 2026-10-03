import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProducts, deleteProduct, errorMessage } from '../api.js';
import ProductForm from './ProductForm.jsx';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const number = new Intl.NumberFormat('en-PH');

export default function ProductList({ user, onLogout }) {
  const isAdmin = user.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [formFor, setFormFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.product_name, product.description, product.id]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
    );
  }, [products, search]);

  const totalUnits = products.reduce((total, product) => total + Number(product.quantity || 0), 0);
  const inventoryValue = products.reduce((total, product) =>
    total + Number(product.price || 0) * Number(product.quantity || 0), 0);
  const lowStockCount = products.filter((product) => Number(product.quantity) <= 5).length;

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.product_name}"?`)) return;
    try {
      await deleteProduct(product.id);
      setNotice('Product removed from your inventory.');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleSaved = async (message) => {
    setFormFor(null);
    setNotice(message);
    await load();
  };

  const initials = (user.username || '?').slice(0, 2);

  return (
    <main className="container">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Stockroom home">
          <span className="brand-mark">S</span>
          <span><span className="brand-name">STOCKROOM</span><span className="brand-caption">PRODUCT WORKSPACE</span></span>
        </a>
        <div className="account">
          <span className="avatar" aria-hidden="true">{initials}</span>
          <span className="account-copy"><strong>{user.username}</strong><span>{isAdmin ? 'Administrator' : 'Workspace member'}</span></span>
          {!isAdmin && <span className="role-badge">View only</span>}
          <button className="button secondary" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">Inventory overview</p>
          <h1>Your products, at a glance.</h1>
          <p>Keep track of what you have and what needs attention.</p>
        </div>
        {isAdmin && <button className="button" onClick={() => setFormFor({})}>＋ Add product</button>}
      </section>

      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert success" role="status" onClick={() => setNotice('')}>{notice}</div>}

      <section className="stats" aria-label="Inventory summary">
        <article className="stat-card">
          <span className="stat-label">Products in catalog</span>
          <strong className="stat-value">{number.format(products.length)}</strong>
          <p className="stat-note">Unique products listed</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total units in stock</span>
          <strong className="stat-value">{number.format(totalUnits)}</strong>
          <p className="stat-note">Across all products</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Inventory value</span>
          <strong className="stat-value">{peso.format(inventoryValue)}</strong>
          <p className="stat-note">{lowStockCount} {lowStockCount === 1 ? 'product' : 'products'} with 5 or fewer units</p>
        </article>
      </section>

      <section className="inventory" aria-label="Product inventory">
        <div className="inventory-head">
          <div className="inventory-title">
            <h2>Product catalog</h2>
            <p>{search ? `${visibleProducts.length} matching products` : 'Browse the items in your workspace'}</p>
          </div>
          <div className="inventory-tools">
            <label className="search">
              <span className="sr-only">Search products</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." />
            </label>
          </div>
        </div>

        {loading ? <p className="center">Loading your product catalog…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Description</th><th className="num">Price</th><th className="num">In stock</th><th>Added</th>
                  {isAdmin && <th aria-label="Actions"></th>}
                </tr>
              </thead>
              <tbody>
                {visibleProducts.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5}>
                      <div className="empty-state">
                        <span className="empty-icon" aria-hidden="true">⌕</span>
                        <h3>{search ? 'No matching products' : 'Your catalog is empty'}</h3>
                        <p>{search ? 'Try another name or clear your search.' : isAdmin ? 'Add your first product to get started.' : 'Products will appear here when they are added.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-thumb" aria-hidden="true">{(product.product_name || '?').slice(0, 1)}</span>
                        <span><strong>{product.product_name}</strong><small>SKU-{String(product.id).padStart(4, '0')}</small></span>
                      </div>
                    </td>
                    <td className="description-cell">{product.description || 'No description'}</td>
                    <td className="num price">{peso.format(Number(product.price))}</td>
                    <td className="num"><span className={`stock-pill${Number(product.quantity) <= 5 ? ' low' : ''}`}>{number.format(Number(product.quantity))} units</span></td>
                    <td>{product.created_at ? new Date(product.created_at.replace(' ', 'T')).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                    {isAdmin && (
                      <td className="actions">
                        <button className="button secondary small" onClick={() => setFormFor(product)}>Edit</button>
                        <button className="button danger small" onClick={() => handleDelete(product)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isAdmin && formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          onSaved={handleSaved}
          onCancel={() => setFormFor(null)}
        />
      )}
    </main>
  );
}
