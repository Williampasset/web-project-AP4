import { useState, useEffect } from 'react';
import type { Client } from '@type/client.type';

interface ClientModalProps {
  isOpen: boolean;
  client?: Client | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    address: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function ClientModal({
  isOpen,
  client,
  onClose,
  onSubmit,
  isLoading = false,
}: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        address: client.address || '',
        email: client.email || '',
        phone: client.phone || '',
      });
    } else {
      setFormData({
        name: '',
        address: '',
        email: '',
        phone: '',
      });
    }
    setErrors({});
  }, [client, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors({
        submit: (error as Error).message || 'Erreur lors de la soumission',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className='client-modal-overlay' onClick={onClose}>
      <div className='client-modal' onClick={(e) => e.stopPropagation()}>
        <div className='client-modal-header'>
          <h2>{client ? 'Modifier le client' : 'Ajouter un client'}</h2>
          <button
            type='button'
            className='client-modal-close'
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='client-modal-form'>
          <div className='client-form-group'>
            <label htmlFor='client-name'>Nom *</label>
            <input
              id='client-name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder='Nom du client'
              disabled={isLoading}
            />
            {errors.name && (
              <span className='client-form-error'>{errors.name}</span>
            )}
          </div>

          <div className='client-form-group'>
            <label htmlFor='client-address'>Adresse *</label>
            <input
              id='client-address'
              type='text'
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder='Adresse du client'
              disabled={isLoading}
            />
            {errors.address && (
              <span className='client-form-error'>{errors.address}</span>
            )}
          </div>

          <div className='client-form-group'>
            <label htmlFor='client-email'>Email</label>
            <input
              id='client-email'
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder='Email du client'
              disabled={isLoading}
            />
            {errors.email && (
              <span className='client-form-error'>{errors.email}</span>
            )}
          </div>

          <div className='client-form-group'>
            <label htmlFor='client-phone'>Téléphone</label>
            <input
              id='client-phone'
              type='tel'
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder='Téléphone du client'
              disabled={isLoading}
            />
          </div>

          {errors.submit && (
            <div className='client-form-error-box'>{errors.submit}</div>
          )}

          <div className='client-modal-actions'>
            <button
              type='button'
              className='client-modal-cancel'
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type='submit'
              className='client-modal-submit'
              disabled={isLoading}
            >
              {isLoading ? 'Chargement...' : client ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
