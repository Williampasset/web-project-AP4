import { useState } from 'react';
import { ChevronDown, Eye, Calendar, Package, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '@service/date.service';
import { getStatusClass, getStatusLabel } from '@service/mapper.service';
import { type CommandStatus, COMMAND_STATUSES } from '@type/command';
import type { Command } from '@type/command';
import Wizard, { type WizardStep } from '@component/Wizard/Wizard';
import './CommandCard.css';

interface CommandCardProps {
  command: Command;
  onStatusChange: (commandId: number, status: CommandStatus) => Promise<void>;
  onViewDetails: (commandId: number) => void;
  isUpdating: boolean;
}

export default function CommandCard({
  command,
  onStatusChange,
  onViewDetails,
  isUpdating,
}: CommandCardProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusChangeWizard, setStatusChangeWizard] = useState<{
    open: boolean;
    newStatus: CommandStatus | null;
  }>({
    open: false,
    newStatus: null,
  });

  const handleStatusClick = (newStatus: CommandStatus) => {
    setIsStatusDropdownOpen(false);
    setStatusChangeWizard({ open: true, newStatus });
  };

  const handleStatusConfirm = async () => {
    if (!statusChangeWizard.newStatus) return;

    try {
      await onStatusChange(command.id, statusChangeWizard.newStatus);
      toast.success(
        `Statut changé en ${getStatusLabel(statusChangeWizard.newStatus)}`,
      );
      setStatusChangeWizard({ open: false, newStatus: null });
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error('Failed to update command status:', err);
    }
  };

  const handleStatusCancel = () => {
    setStatusChangeWizard({ open: false, newStatus: null });
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
   * Wizard steps for status change confirmation
   */
  const statusChangeSteps: WizardStep[] = [
    {
      id: 'reason',
      title: 'Raison',
      content: (
        <div className='command-card__wizard-content'>
          <p className='command-card__wizard-text'>
            Vous êtes sur le point de changer le statut de cette commande de{' '}
            <strong>{getStatusLabel(command.status)}</strong> à{' '}
            <strong>
              {getStatusLabel(statusChangeWizard.newStatus as CommandStatus)}
            </strong>
          </p>
          <div className='command-card__wizard-info'>
            <div className='command-card__wizard-detail'>
              <span className='command-card__wizard-label'>Référence</span>
              <span className='command-card__wizard-value'>
                {command.reference}
              </span>
            </div>
            <div className='command-card__wizard-detail'>
              <span className='command-card__wizard-label'>Montant</span>
              <span className='command-card__wizard-value'>
                {getTotalValue().toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'confirm',
      title: 'Confirmation',
      content: (
        <div className='command-card__wizard-content'>
          <div className='command-card__wizard-confirmation'>
            <div className='command-card__wizard-confirmation-badge'>
              {getStatusLabel(statusChangeWizard.newStatus as CommandStatus)}
            </div>
            <p className='command-card__wizard-confirmation-text'>
              Êtes-vous sûr de vouloir modifier ce statut ?
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className={`command-card command-card--${getStatusClass(command.status)}`}
      >
        <div className='command-card__status-badge'>
          <span
            className={`command-card__status command-card__status--${getStatusClass(command.status)}`}
          >
            {getStatusLabel(command.status)}
          </span>
        </div>

        <div className='command-card__header'>
          <div className='command-card__ref-section'>
            <h3 className='command-card__reference'>{command.reference}</h3>
            <p className='command-card__client'>Client #{command.clientId}</p>
          </div>
          <div className='command-card__value-section'>
            <p className='command-card__value-label'>Montant</p>
            <p className='command-card__value-amount'>
              {getTotalValue().toFixed(2)} €
            </p>
          </div>
        </div>

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

          {command.deliveryDate && (
            <div className='command-card__info-item'>
              <Calendar size={16} className='command-card__info-icon' />
              <div className='command-card__info-content'>
                <span className='command-card__info-label'>Livrée</span>
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

          {command.truckId && (
            <div className='command-card__info-item'>
              <Truck size={16} className='command-card__info-icon' />
              <div className='command-card__info-content'>
                <span className='command-card__info-label'>Camion</span>
                <span className='command-card__info-value'>
                  #{command.truckId}
                </span>
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
                  <span className='command-card__item-ref'>
                    Article #{item.articleId}
                  </span>
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
            <div className='command-card__status-dropdown'>
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                disabled={isUpdating}
                className='command-card__action-button command-card__action-button--status'
                title='Changer le statut de la commande'
                aria-label='Changer le statut de la commande'
                aria-expanded={isStatusDropdownOpen}
              >
                <ChevronDown size={16} />
                Changer statut
              </button>

              {isStatusDropdownOpen && !isUpdating && (
                <div className='command-card__dropdown-menu'>
                  {COMMAND_STATUSES.filter((s) => s !== command.status).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusClick(status)}
                        className={`command-card__dropdown-item command-card__dropdown-item--${getStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

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

      {statusChangeWizard.open && statusChangeWizard.newStatus && (
        <div className='command-card__wizard-overlay'>
          <div className='command-card__wizard-container'>
            <Wizard
              steps={statusChangeSteps}
              onComplete={handleStatusConfirm}
              onCancel={handleStatusCancel}
              title='Changement de statut'
              subtitle={`Commande ${command.reference}`}
              showProgress={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
