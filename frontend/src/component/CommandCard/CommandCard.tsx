import { Eye, Calendar, Package, Truck } from 'lucide-react';
import { formatDate } from '@service/date.service';
import { getStatusClass, getStatusLabel } from '@service/mapper.service';
import type { Command } from '@type/command.type';
import './CommandCard.css';

interface CommandCardProps {
  command: Command;
  onViewDetails: (commandId: number) => void;
}

export default function CommandCard({
  command,
  onViewDetails,
}: CommandCardProps) {
  /**
   * Get total command value
   */
  const getTotalValue = (): number => {
    return command.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  };

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
                <span className='command-card__info-label'>Terminée</span>
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
                  #{command.truck?.imat || 'Inconnu'}
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
                    {item.article?.label || 'Inconnu'}
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
