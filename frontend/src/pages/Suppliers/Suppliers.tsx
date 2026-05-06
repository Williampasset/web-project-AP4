import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useState } from 'react';
import { useSuppliers } from '../../hooks/suppliers.hooks';
import type { SupplierArticle } from '@type/supplier.type';
import './Suppliers.css';

export default function Suppliers() {
  const {
    data: suppliers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSuppliers();

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return '✗ Rupture';
    if (stock < 10) return '⚠ Faible';
    return '✓ Disponible';
  };

  const formatLocation = (article: SupplierArticle) => {
    const { building, aisle, shelf, cell } = article.location;
    return `${building}-${aisle}-${shelf}-${cell}`;
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='suppliers-error'>
          <p>Erreur : {(error as Error)?.message ?? 'Impossible de charger les fournisseurs.'}</p>
          <button onClick={() => refetch()}>Réessayer</button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='suppliers-header'>
        <h1>Fournisseurs</h1>
        <span className='suppliers-count'>{filtered.length} fournisseur{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className='suppliers-search'>
        <input
          type='text'
          placeholder='Rechercher par nom, email ou adresse...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='search-input'
        />
      </div>

      {filtered.length === 0 ? (
        <p className='suppliers-empty'>Aucun fournisseur trouvé.</p>
      ) : (
        <div className='suppliers-list'>
          {filtered.map((supplier) => (
            <div key={supplier.id} className='supplier-card'>
              <div
                className='supplier-card-header'
                onClick={() => toggleExpand(supplier.id)}
              >
                <div className='supplier-info'>
                  <div className='supplier-name'>{supplier.name}</div>
                  <div className='supplier-meta'>
                    {supplier.email && <span>✉ {supplier.email}</span>}
                    {supplier.phone && <span>📞 {supplier.phone}</span>}
                    <span>📍 {supplier.address}</span>
                  </div>
                </div>
                <div className='supplier-right'>
                  <span className='articles-badge'>
                    {supplier.articles.length} article{supplier.articles.length !== 1 ? 's' : ''}
                  </span>
                  <span className={`expand-chevron ${expandedId === supplier.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedId === supplier.id && (
                <div className='supplier-articles'>
                  {supplier.articles.length === 0 ? (
                    <p className='no-articles'>Aucun article associé à ce fournisseur.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Réf.</th>
                          <th>Label</th>
                          <th>Emplacement</th>
                          <th>Prix unit.</th>
                          <th>Poids (kg)</th>
                          <th>Volume (m³)</th>
                          <th>Stock</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplier.articles.map((article) => (
                          <tr key={article.id}>
                            <td>
                              <span className='article-ref'>{article.reference}</span>
                            </td>
                            <td>{article.label}</td>
                            <td>
                              <span className='location-badge'>{formatLocation(article)}</span>
                            </td>
                            <td>{article.price.toFixed(2)} €</td>
                            <td>{article.weight} kg</td>
                            <td>{article.volume} m³</td>
                            <td>{article.stock}</td>
                            <td>
                              <span className={`stock-status ${getStockStatus(article.stock)}`}>
                                {getStockLabel(article.stock)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
