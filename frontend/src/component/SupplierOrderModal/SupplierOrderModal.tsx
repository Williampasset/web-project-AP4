import type { FreeTransitLocation, Supplier } from '@type/supplier.type';
import { XIcon } from 'lucide-react';
import type { SupplierOrderModalState } from '../../pages/Suppliers/types';
import { formatTransitLocation } from '../suppliers.utils';

interface SupplierOrderModalProps {
  supplier: Supplier;
  modal: SupplierOrderModalState;
  freeTransitLocations: FreeTransitLocation[];
  isSending: boolean;
  onClose: () => void;
  onChange: (updater: (prev: SupplierOrderModalState) => SupplierOrderModalState) => void;
  onSend: () => void;
}

export default function SupplierOrderModal({
  supplier,
  modal,
  freeTransitLocations,
  isSending,
  onClose,
  onChange,
  onSend,
}: SupplierOrderModalProps) {
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <div className='modal__header'>
          <h2>Commande par email</h2>
          <button className='modal__close' onClick={onClose}>
            <XIcon size={18} />
          </button>
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
            <input
              type='text'
              value={`${modal.article.reference} – ${modal.article.label}`}
              disabled
            />
          </div>
          <div className='modal__field'>
            <label>Quantité souhaitée</label>
            <input
              type='number'
              min={1}
              value={modal.quantity}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  quantity: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
            />
          </div>
          <div className='modal__field'>
            <label>Zone de dépôt IN</label>
            <select
              value={modal.transitLocationId ?? ''}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  transitLocationId:
                    e.target.value.length > 0 ? Number(e.target.value) : null,
                }))
              }
            >
              {freeTransitLocations.map((location, i) => (
                <option key={location.id} value={location.id}>
                  {formatTransitLocation(location, i)}
                </option>
              ))}
            </select>
            {freeTransitLocations.length === 0 && (
              <span className='modal__hint'>
                Aucune zone IN libre actuellement.
              </span>
            )}
          </div>
          <div className='modal__field'>
            <label>
              Message complémentaire <span>(optionnel)</span>
            </label>
            <textarea
              rows={3}
              placeholder='Informations supplémentaires…'
              value={modal.message}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, message: e.target.value }))
              }
            />
          </div>
        </div>
        <div className='modal__footer'>
          <button className='btn-cancel' onClick={onClose}>
            Annuler
          </button>
          <button
            className='btn-send'
            onClick={onSend}
            disabled={
              isSending ||
              !modal.transitLocationId ||
              freeTransitLocations.length === 0
            }
          >
            {isSending ? 'Envoi...' : "Envoyer l'email"}
          </button>
        </div>
      </div>
    </div>
  );
}
