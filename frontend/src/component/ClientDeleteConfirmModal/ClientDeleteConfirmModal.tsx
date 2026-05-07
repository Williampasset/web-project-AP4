interface ClientDeleteConfirmModalProps {
  isOpen: boolean;
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientDeleteConfirmModal({
  isOpen,
  clientName,
  onConfirm,
  onCancel,
  isLoading = false,
}: ClientDeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className='delete-modal-overlay' onClick={onCancel}>
      <div className='delete-modal' onClick={(e) => e.stopPropagation()}>
        <div className='delete-modal-header'>
          <h2>Supprimer le client</h2>
        </div>

        <p className='delete-modal-message'>
          Êtes-vous sûr de vouloir supprimer le client <strong>{clientName}</strong> ?
          Cette action est irréversible.
        </p>

        <div className='delete-modal-actions'>
          <button
            type='button'
            className='delete-modal-cancel'
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type='button'
            className='delete-modal-confirm'
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
