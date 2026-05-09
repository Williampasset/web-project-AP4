import { useState, useEffect } from 'react';
import type { User } from '@type/user.type';
import { XIcon } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    matricule: string;
    firstName: string;
    lastName: string;
    password: string;
    role: 'MANAGER' | 'MAGASINIER';
    managerId?: number;
  }) => Promise<void>;
  isLoading?: boolean;
  managers?: User[];
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  managers = [],
}: UserModalProps) {
  const [formData, setFormData] = useState({
    matricule: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'MAGASINIER' as 'MANAGER' | 'MAGASINIER',
    managerId: undefined as number | undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        matricule: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'MAGASINIER',
        managerId: undefined,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.matricule.trim()) {
      newErrors.matricule = 'Le matricule est requis';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit avoir au moins 8 caractères';
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
        submit: (error as Error).message || 'Erreur lors de la création',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className='user-modal-overlay' onClick={onClose}>
      <div className='user-modal' onClick={(e) => e.stopPropagation()}>
        <div className='user-modal-header'>
          <h2>Ajouter un utilisateur</h2>
          <button
            type='button'
            className='user-modal-close'
            onClick={onClose}
            disabled={isLoading}
          >
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='user-modal-form'>
          <div className='user-form-row'>
            <div className='user-form-group'>
              <label htmlFor='user-matricule'>Matricule *</label>
              <input
                id='user-matricule'
                type='text'
                value={formData.matricule}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    matricule: e.target.value,
                  }))
                }
                placeholder='MAT-001'
                disabled={isLoading}
              />
              {errors.matricule && (
                <span className='user-form-error'>{errors.matricule}</span>
              )}
            </div>

            <div className='user-form-group'>
              <label htmlFor='user-role'>Rôle *</label>
              <select
                id='user-role'
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value as 'MANAGER' | 'MAGASINIER',
                  }))
                }
                disabled={isLoading}
              >
                <option value='MAGASINIER'>Magasinier</option>
                <option value='MANAGER'>Manager</option>
              </select>
            </div>
          </div>

          <div className='user-form-row'>
            <div className='user-form-group'>
              <label htmlFor='user-firstName'>Prénom *</label>
              <input
                id='user-firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder='John'
                disabled={isLoading}
              />
              {errors.firstName && (
                <span className='user-form-error'>{errors.firstName}</span>
              )}
            </div>

            <div className='user-form-group'>
              <label htmlFor='user-lastName'>Nom *</label>
              <input
                id='user-lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder='Doe'
                disabled={isLoading}
              />
              {errors.lastName && (
                <span className='user-form-error'>{errors.lastName}</span>
              )}
            </div>
          </div>

          <div className='user-form-group'>
            <label htmlFor='user-password'>Mot de passe *</label>
            <input
              id='user-password'
              type='password'
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder='Minimum 8 caractères'
              disabled={isLoading}
            />
            {errors.password && (
              <span className='user-form-error'>{errors.password}</span>
            )}
          </div>

          {managers.length > 0 && (
            <div className='user-form-group'>
              <label htmlFor='user-manager'>Manager (optionnel)</label>
              <select
                id='user-manager'
                value={formData.managerId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    managerId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                disabled={isLoading}
              >
                <option value=''>Aucun manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errors.submit && (
            <div className='user-form-error-box'>{errors.submit}</div>
          )}

          <div className='user-modal-actions'>
            <button
              type='button'
              className='user-modal-cancel'
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type='submit'
              className='user-modal-submit'
              disabled={isLoading}
            >
              {isLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
