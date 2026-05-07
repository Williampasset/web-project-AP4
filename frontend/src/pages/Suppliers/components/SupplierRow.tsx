import type {
  FreeTransitLocation,
  Supplier,
  SupplierArticle,
} from '@type/supplier.type';
import { useQueryClient } from '@tanstack/react-query';
import { restockSupplierArticle } from '@service/api/suppliers.service';
import { useMemo, useState } from 'react';
import type { SupplierOrderModalState } from '../types';
import {
  articleMatchesSearch,
  formatLocation,
  formatTransitLocation,
  getStockClass,
  getStockLabel,
} from '../suppliers.utils';
import SupplierOrderModal from './SupplierOrderModal';

interface SupplierRowProps {
  supplier: Supplier;
  search: string;
  freeTransitLocations: FreeTransitLocation[];
}

export default function SupplierRow({
  supplier,
  search,
  freeTransitLocations,
}: SupplierRowProps) {
  const articleMatch = useMemo(
    () =>
      search.length > 0 &&
      supplier.articles.some((a) => articleMatchesSearch(a, search)),
    [search, supplier.articles],
  );

  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<SupplierOrderModalState | null>(null);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const isOpen = open || articleMatch;

  const openModal = (e: React.MouseEvent, article: SupplierArticle) => {
    e.stopPropagation();
    setModal({
      article,
      quantity: 1,
      transitLocationId: freeTransitLocations[0]?.id ?? null,
      message: '',
    });
  };

  const sendEmail = async () => {
    if (!modal || !supplier.email || !modal.transitLocationId) return;

    const selectedTransit = freeTransitLocations.find(
      (l) => l.id === modal.transitLocationId,
    );

    if (!selectedTransit) {
      alert("La zone IN sélectionnée n'est plus libre. Choisissez-en une autre.");
      return;
    }

    setIsSending(true);

    try {
      await restockSupplierArticle(
        supplier.id,
        modal.article.id,
        modal.quantity,
        modal.transitLocationId,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
        queryClient.invalidateQueries({ queryKey: ['suppliers', 'free-transit'] }),
        queryClient.invalidateQueries({ queryKey: ['locations', 'warehouse-view'] }),
        queryClient.invalidateQueries({ queryKey: ['articles'] }),
        queryClient.invalidateQueries({ queryKey: ['articles', 'live-stock'] }),
      ]);

      const subject = encodeURIComponent(
        `Demande de réapprovisionnement – ${modal.article.reference}`,
      );
      const body = encodeURIComponent(
        `Bonjour,\n\nNous souhaitons passer commande pour l'article suivant :\n\n` +
          `Référence : ${modal.article.reference}\n` +
          `Désignation : ${modal.article.label}\n` +
          `Quantité souhaitée : ${modal.quantity}\n` +
          `Zone de dépôt IN : ${formatTransitLocation(
            selectedTransit,
            freeTransitLocations.findIndex((l) => l.id === selectedTransit.id),
          )}\n` +
          (modal.message
            ? `\nMessage complémentaire :\n${modal.message}\n`
            : '') +
          `\nCordialement`,
      );

      window.location.href = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
      setModal(null);
    } catch (error) {
      alert(
        (error as Error)?.message ??
          "Impossible d'enregistrer la commande fournisseur.",
      );
    } finally {
      setIsSending(false);
    }
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
            {supplier.articles.length} article
            {supplier.articles.length !== 1 ? 's' : ''}
          </span>
          <span
            className={`supplier-row__chevron ${isOpen ? 'supplier-row__chevron--open' : ''}`}
          >
            ›
          </span>
        </div>
      </div>

      {isOpen && (
        <div className='supplier-row__articles'>
          {supplier.articles.length === 0 ? (
            <p className='supplier-row__empty'>
              Aucun article pour ce fournisseur.
            </p>
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
                    <td>
                      <code>{article.reference}</code>
                    </td>
                    <td>{article.label}</td>
                    <td>
                      <span className='badge badge--gray'>
                        {formatLocation(article)}
                      </span>
                    </td>
                    <td>{article.price.toFixed(2)} €</td>
                    <td>{article.weight} kg</td>
                    <td>{article.volume} m³</td>
                    <td>{article.stock}</td>
                    <td>
                      <span className={getStockClass(article.stock)}>
                        {getStockLabel(article.stock)}
                      </span>
                    </td>
                    <td>
                      <button
                        className='btn-order'
                        disabled={!supplier.email || freeTransitLocations.length === 0}
                        title={
                          !supplier.email
                            ? 'Aucun email renseigné'
                            : freeTransitLocations.length === 0
                              ? 'Aucune zone IN libre'
                              : 'Commander par email'
                        }
                        onClick={(e) => openModal(e, article)}
                      >
                        Commander
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <SupplierOrderModal
          supplier={supplier}
          modal={modal}
          freeTransitLocations={freeTransitLocations}
          isSending={isSending}
          onClose={() => setModal(null)}
          onChange={(updater) => setModal((prev) => (prev ? updater(prev) : prev))}
          onSend={sendEmail}
        />
      )}
    </div>
  );
}
