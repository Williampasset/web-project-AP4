import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useState } from 'react';
import { useSuppliers } from '../../hooks/suppliers.hooks';
import type { Supplier, SupplierArticle } from '@type/supplier.type';
import './Suppliers.css';

function SupplierRow({ supplier, search }: { supplier: Supplier; search: string }) {
  const articleMatch =
    search.length > 0 &&
    supplier.articles.some(
      (a) =>
        a.label.toLowerCase().includes(search.toLowerCase()) ||
        a.reference.toLowerCase().includes(search.toLowerCase()),
    );

  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<{
    article: SupplierArticle;
    quantity: number;
    message: string;
  } | null>(null);

  // Auto-ouvre si la recherche correspond à un article
  const isOpen = open || articleMatch;

  const formatLocation = (article: SupplierArticle) => {
    const { building, aisle, shelf, cell } = article.location;
    return `${building}-${aisle}-${shelf}-${cell}`;
  };

  const getStockClass = (stock: number) => {
    if (stock === 0) return 'badge badge--danger';
    if (stock < 10) return 'badge badge--warning';
    return 'badge badge--success';
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return 'Rupture';
    if (stock < 10) return 'Faible';
    return 'Disponible';
  };

  const openModal = (e: React.MouseEvent, article: SupplierArticle) => {
    e.stopPropagation();
    setModal({
      article,
      quantity: 1,
      message: '',
    });
  };

  const sendEmail = () => {
    if (!modal || !supplier.email) return;
    const subject = encodeURIComponent(
      `Demande de réapprovisionnement – ${modal.article.reference}`,
    );
    const body = encodeURIComponent(
      `Bonjour,\n\nNous souhaitons passer commande pour l'article suivant :\n\n` +
      `Référence : ${modal.article.reference}\n` +
      `Désignation : ${modal.article.label}\n` +
      `Quantité souhaitée : ${modal.quantity}\n` +
      (modal.message ? `\nMessage complémentaire :\n${modal.message}\n` : '') +
      `\nCordialement`,
    );
    window.location.href = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
    setModal(null);
  };

  return (
    <div className='supplier-row'>
      <div className='supplier-row__header' onClick={() => setOpen((o) => !o)}>
        <div className='supplier-row__identity'>
          <span className='supplier-row__name'>{supplier.name}</span>
          <span className='supplier-row__meta'>
            {supplier.phone && <>{supplier.phone}</>}
            {supplier.phone && supplier.email && ' · '}
            {supplier.email && <>{supplier.email}</>}
            {(supplier.phone || supplier.email) && ' · '}
            {supplier.address}
          </span>
        </div>
        <div className='supplier-row__right'>
          <span className='badge badge--blue'>
            {supplier.articles.length} article{supplier.articles.length !== 1 ? 's' : ''}
          </span>
          <span className={`supplier-row__chevron ${isOpen ? 'supplier-row__chevron--open' : ''}`}>
            ›
          </span>
        </div>
      </div>

      {isOpen && (
        <div className='supplier-row__articles'>
          {supplier.articles.length === 0 ? (
            <p className='supplier-row__empty'>Aucun article pour ce fournisseur.</p>
          ) : (
            <table className='articles-table'>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Article</th>
                  <th>Emplacement</th>
                  <th>Prix unit.</th>
                  <th>Poids</th>
                  <th>Volume</th>
                  <th>Stock</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {supplier.articles.map((article) => (
                  <tr key={article.id}>
                    <td><code>{article.reference}</code></td>
                    <td>{article.label}</td>
                    <td><span className='badge badge--gray'>{formatLocation(article)}</span></td>
                    <td>{article.price.toFixed(2)} €</td>
                    <td>{article.weight} kg</td>
                    <td>{article.volume} m³</td>
                    <td>{article.stock}</td>
                    <td><span className={getStockClass(article.stock)}>{getStockLabel(article.stock)}</span></td>
                    <td>
                      <button
                        className='btn-order'
                        disabled={!supplier.email}
                        title={supplier.email ? 'Commander par email' : 'Aucun email renseigné'}
                        onClick={(e) => openModal(e, article)}
                      >
                        ✉ Commander
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal commande email */}
      {modal && (
        <div className='modal-overlay' onClick={() => setModal(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal__header'>
              <h2>Commande par email</h2>
              <button className='modal__close' onClick={() => setModal(null)}>×</button>
            </div>
            <div className='modal__body'>
              <div className='modal__field'>
                <label>Fournisseur</label>
                <input type='text' value={supplier.name} disabled />
              </div>
              <div className='modal__field'>
                <label>Destinataire</label>
                <input type='text' value={supplier.email ?? ''} disabled />
              </div>
              <div className='modal__field'>
                <label>Article</label>
                <input type='text' value={`${modal.article.reference} – ${modal.article.label}`} disabled />
              </div>
              <div className='modal__field'>
                <label>Quantité souhaitée</label>
                <input
                  type='number'
                  min={1}
                  value={modal.quantity}
                  onChange={(e) =>
                    setModal((m) => m ? { ...m, quantity: Math.max(1, parseInt(e.target.value) || 1) } : m)
                  }
                />
              </div>
              <div className='modal__field'>
                <label>Message complémentaire <span>(optionnel)</span></label>
                <textarea
                  rows={3}
                  placeholder='Informations supplémentaires…'
                  value={modal.message}
                  onChange={(e) => setModal((m) => m ? { ...m, message: e.target.value } : m)}
                />
              </div>
            </div>
            <div className='modal__footer'>
              <button className='btn-cancel' onClick={() => setModal(null)}>Annuler</button>
              <button className='btn-send' onClick={sendEmail}>✉ Envoyer l’email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Suppliers() {
  const { data: suppliers = [], isLoading, isError, error, refetch } = useSuppliers();
  const [search, setSearch] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase()) ||
      s.articles.some(
        (a) =>
          a.label.toLowerCase().includes(search.toLowerCase()) ||
          a.reference.toLowerCase().includes(search.toLowerCase()),
      ),
  );

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
      <div className='suppliers-page'>
        <div className='suppliers-page__header'>
          <h1>Fournisseurs</h1>
          <p>{filtered.length} fournisseur{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        <input
          type='text'
          placeholder='Rechercher par fournisseur, article, référence…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='suppliers-page__search'
        />

        {filtered.length === 0 ? (
          <p className='suppliers-page__empty'>Aucun fournisseur trouvé.</p>
        ) : (
          <div className='suppliers-page__list'>
            {filtered.map((supplier) => (
              <SupplierRow key={supplier.id} supplier={supplier} search={search} />
            ))}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
