import { useEffect, useState } from 'react';
import {
  Eye,
  Calendar,
  Package,
  Truck,
  User,
  TriangleAlertIcon,
} from 'lucide-react';
import { formatDate } from '@service/date.service';
import { getStatusClass, getStatusLabel } from '@service/mapper.service';
import type { Command } from '@type/command.type';
import type { User as AppUser } from '@type/user.type';
import type { Truck as AppTruck } from '@type/truck.type';
import './CommandCard.css';

interface CommandCardProps {
  command: Command;
  onViewDetails: (commandId: number) => void;
  editableAssignments?: boolean;
  users?: AppUser[];
  trucks?: AppTruck[];
  isUpdating?: boolean;
  onUpdateAssignments?: (
    commandId: number,
    data: { userId?: number; truckId?: number | null },
  ) => Promise<void>;
}

export default function CommandCard({
  command,
  onViewDetails,
  editableAssignments = false,
  users = [],
  trucks = [],
  isUpdating = false,
  onUpdateAssignments,
}: CommandCardProps) {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingTruck, setIsEditingTruck] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number>(command.userId);
  const [selectedTruckId, setSelectedTruckId] = useState<string>(
    command.truckId ? String(command.truckId) : '',
  );

  useEffect(() => {
    setSelectedUserId(command.userId);
    setSelectedTruckId(command.truckId ? String(command.truckId) : '');
    setIsEditingUser(false);
    setIsEditingTruck(false);
  }, [command.id, command.userId, command.truckId]);

  /**
   * Handle user assignment update
   * @param value - The new user ID as a string (from the select input)
   * @returns A promise that resolves when the update is complete
   */
  const handleUserUpdate = async (value: string) => {
    if (value === '') {
      // Remove user assignment
      setSelectedUserId(0); // Reset to invalid ID
      if (onUpdateAssignments && command.userId !== null) {
        await onUpdateAssignments(command.id, { userId: null as any });
      }
      setIsEditingUser(false);
      return;
    }

    const nextUserId = Number(value);
    if (Number.isNaN(nextUserId)) return;

    setSelectedUserId(nextUserId);

    if (onUpdateAssignments && nextUserId !== command.userId) {
      await onUpdateAssignments(command.id, { userId: nextUserId });
    }

    setIsEditingUser(false);
  };

  /**
   * Handle truck assignment update
   * @param value - The new truck ID as a string (from the select input)
   * @returns A promise that resolves when the update is complete
   */
  const handleTruckUpdate = async (value: string) => {
    setSelectedTruckId(value);

    if (value === '') {
      if (onUpdateAssignments && command.truckId !== null) {
        await onUpdateAssignments(command.id, { truckId: null });
      }
      setIsEditingTruck(false);
      return;
    }

    const nextTruckId = Number(value);
    if (Number.isNaN(nextTruckId)) {
      setIsEditingTruck(false);
      return;
    }

    if (onUpdateAssignments && nextTruckId !== command.truckId) {
      await onUpdateAssignments(command.id, { truckId: nextTruckId });
    }

    setIsEditingTruck(false);
  };

  /**
   * Check if command is late
   */
  const isLate = (): boolean => {
    if (!command.deliveryDate || command.status === 'DELIVERED') return false;
    return new Date(command.deliveryDate) < new Date();
  };

  /**
   * Get status to display (with late indicator)
   */
  const getDisplayStatus = (): string => {
    if (isLate()) {
      return 'En retard';
    }
    return getStatusLabel(command.status);
  };

  /**
   * Get status class (with late indicator)
   */
  const getDisplayStatusClass = (): string => {
    if (isLate()) {
      return 'late';
    }
    return getStatusClass(command.status);
  };

  /**
   * Check if stock is insufficient for any item
   */
  const hasInsufficientStock = (): boolean => {
    return command.items.some((item) => {
      const availableStock = item.article?.stock ?? 0;
      return availableStock < item.quantity;
    });
  };

  /**
   * Get total command value
   */
  const getTotalValue = (): number => {
    return command.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  };

  /**
   * Get total command weight
   * @returns The total weight of the command
   */
  const getTotalWeight = (): number => {
    return command.items.reduce(
      (total, item) => total + (item.article?.weight ?? 0) * item.quantity,
      0,
    );
  };

  /**
   * Get total command volume
   * @returns The total volume of the command
   */
  const getTotalVolume = (): number => {
    return command.items.reduce(
      (total, item) => total + (item.article?.volume ?? 0) * item.quantity,
      0,
    );
  };

  /**
   * Check if total volume exceeds truck's max volume
   * @return True if there is a volume overflow, false otherwise
   */
  const hasTruckVolumeOverflow = (): boolean => {
    if (command.status === 'DELIVERED' || command.status === 'CANCELLED') {
      return false;
    }

    if (!command.truck || command.truck.maxVolume == null) return false;
    return getTotalVolume() > command.truck.maxVolume;
  };

  return (
    <>
      <div className={`command-card command-card--${getDisplayStatusClass()}`}>
        <div className='command-card__status-badge'>
          <span
            className={`command-card__status command-card__status--${getDisplayStatusClass()}`}
          >
            {getDisplayStatus()}
          </span>
        </div>

        <div className='command-card__header'>
          <div className='command-card__ref-section'>
            <h3 className='command-card__reference'>{command.reference}</h3>
            <p className='command-card__client'>
              Client #{command.client?.name || 'Inconnu'}
            </p>
          </div>
          <div className='command-card__value-section'>
            <p className='command-card__value-label'>Montant</p>
            <p className='command-card__value-amount'>
              {getTotalValue().toFixed(2)} €
            </p>
          </div>
        </div>

        {(hasInsufficientStock() || hasTruckVolumeOverflow()) && (
          <div className='command-card__alert'>
            {hasInsufficientStock() && (
              <p className='command-card__alert-text'>
                <TriangleAlertIcon /> Stock insuffisant
              </p>
            )}
            {hasTruckVolumeOverflow() && (
              <p className='command-card__alert-text'>
                <TriangleAlertIcon /> Dépassement du volume max camion (
                {getTotalVolume().toFixed(2)} m³ /{' '}
                {command.truck?.maxVolume.toFixed(2)} m³)
              </p>
            )}
          </div>
        )}

        <div className='command-card__info-grid'>
          <div className='command-card__info-item'>
            <Calendar size={16} className='command-card__info-icon' />
            <div className='command-card__info-content'>
              <span className='command-card__info-label'>Créée</span>
              <span className='command-card__info-value'>
                {formatDate(command.commandDate)}
              </span>
            </div>
          </div>

          <div
            className={`command-card__info-item ${editableAssignments ? 'command-card__info-item--editable' : ''}`}
            onClick={() => {
              if (!editableAssignments || isUpdating) return;
              setIsEditingUser(true);
            }}
          >
            <User size={16} className='command-card__info-icon' />
            <div className='command-card__info-content'>
              <span className='command-card__info-label'>Opérateur</span>
              {editableAssignments && isEditingUser ? (
                <select
                  className='command-card__inline-select'
                  value={String(selectedUserId)}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    void handleUserUpdate(event.target.value);
                  }}
                  disabled={isUpdating}
                >
                  <option value=''>Désaffecter l'opérateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <span className='command-card__info-value'>
                  {command.user
                    ? `${command.user.firstName} ${command.user.lastName}`
                    : 'Non affecté'}
                </span>
              )}
            </div>
          </div>

          {command.deliveryDate && (
            <div className='command-card__info-item'>
              <Calendar size={16} className='command-card__info-icon' />
              <div className='command-card__info-content'>
                <span className='command-card__info-label'>Livraison</span>
                <span className='command-card__info-value'>
                  {formatDate(command.deliveryDate)}
                </span>
              </div>
            </div>
          )}

          <div className='command-card__info-item'>
            <Package size={16} className='command-card__info-icon' />
            <div className='command-card__info-content'>
              <span className='command-card__info-label'>Articles</span>
              <span className='command-card__info-value'>
                {command.items.length}
              </span>
            </div>
          </div>

          <div className='command-card__info-item'>
            <Package size={16} className='command-card__info-icon' />
            <div className='command-card__info-content'>
              <span className='command-card__info-label'>Poids total</span>
              <span className='command-card__info-value'>
                {getTotalWeight().toFixed(2)} kg
              </span>
            </div>
          </div>

          <div className='command-card__info-item'>
            <Package size={16} className='command-card__info-icon' />
            <div className='command-card__info-content'>
              <span className='command-card__info-label'>Volume total</span>
              <span className='command-card__info-value'>
                {getTotalVolume().toFixed(2)} m³
              </span>
            </div>
          </div>

          {(command.truckId || editableAssignments) && (
            <div
              className={`command-card__info-item ${editableAssignments ? 'command-card__info-item--editable' : ''}`}
              onClick={() => {
                if (!editableAssignments || isUpdating) return;
                setIsEditingTruck(true);
              }}
            >
              <Truck size={16} className='command-card__info-icon' />
              <div className='command-card__info-content'>
                <span className='command-card__info-label'>Camion</span>
                {editableAssignments && isEditingTruck ? (
                  <select
                    className='command-card__inline-select'
                    value={selectedTruckId}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      void handleTruckUpdate(event.target.value);
                    }}
                    disabled={isUpdating}
                  >
                    <option value=''>Désaffecter le camion</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.imat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className='command-card__info-value'>
                    #{command.truck?.imat || 'Non assigné'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {command.items.length > 0 && (
          <div className='command-card__items-section'>
            <h4 className='command-card__items-title'>
              Articles ({command.items.length})
            </h4>
            <ul className='command-card__items-list'>
              {command.items.slice(0, 2).map((item) => (
                <li key={item.id} className='command-card__item'>
                  <div className='command-card__item-main'>
                    <span className='command-card__item-ref'>
                      {item.article?.label || 'Inconnu'}
                    </span>
                    <span className='command-card__item-meta'>
                      Poids:{' '}
                      {((item.article?.weight ?? 0) * item.quantity).toFixed(2)}{' '}
                      kg
                      {' · '}
                      Volume:{' '}
                      {((item.article?.volume ?? 0) * item.quantity).toFixed(
                        2,
                      )}{' '}
                      m³
                    </span>
                  </div>
                  <span className='command-card__item-qty'>
                    ×{item.quantity}
                  </span>
                  <span className='command-card__item-price'>
                    {(item.quantity * item.unitPrice).toFixed(2)} €
                  </span>
                </li>
              ))}
              {command.items.length > 2 && (
                <li className='command-card__item command-card__item--more'>
                  +{command.items.length - 2} article
                  {command.items.length - 2 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className='command-card__footer'>
          <div className='command-card__actions'>
            <button
              onClick={() => onViewDetails(command.id)}
              className='command-card__action-button command-card__action-button--view'
              title='Voir les détails complets'
              aria-label='Voir les détails de la commande'
            >
              <Eye size={16} />
              Détails
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
