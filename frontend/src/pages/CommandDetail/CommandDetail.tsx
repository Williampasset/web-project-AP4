import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Package, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Loading from '../../component/Loading/Loading';
import { getStatusLabel, getStatusClass } from '@service/mapper.service';
import { formatDate } from '@service/date.service';
import { useCommand, useUpdateCommand } from '../../hooks/commands.hooks';
import './CommandDetail.css';
import {
  useMarkItemPicked,
  usePreparationStatus,
} from '../../hooks/command-preparation.hooks';
import type { CommandStatus } from '@type/command.type';

export default function CommandDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const commandId = id ? parseInt(id) : null;

  const { data: command, isLoading, error } = useCommand(commandId || 0);
  const { mutate: commandUpdate } = useUpdateCommand();

  const { data: preparation } = usePreparationStatus(commandId!);

  const totalItems = preparation?.stats.total ?? 0;
  const preparedCount = preparation?.stats.picked ?? 0;

  const progress = totalItems > 0 ? (preparedCount / totalItems) * 100 : 0;

  const currentItem = useMemo(() => {
    if (!command) return null;

    return command.items.find((item) => !item.commandItemPreparation?.isPicked);
  }, [command]);

  const { mutate: markPicked } = useMarkItemPicked();

  const handleCommandStatusUpdate = (newStatus: CommandStatus) => {
    if (!command) return;

    commandUpdate(
      { id: command.id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success('Statut de la commande mis à jour ✓'),
        onError: () => toast.error('Erreur lors de la mise à jour'),
      },
    );
  };

  const handleItemPrepared = () => {
    if (!currentItem) return;

    if (!command) return;

    if (command.status === 'WAITING') {
      handleCommandStatusUpdate('PENDING');
    }

    if (preparedCount === totalItems - 1) {
      handleCommandStatusUpdate('DELIVERED');
    }

    markPicked(
      {
        commandItemId: currentItem.id,
        commandId: command?.id!,
      },
      {
        onSuccess: () => toast.success('Article préparé ✓'),
        onError: () => toast.error('Erreur'),
      },
    );
  };

  /**
   * Calculating totals and stats
   */
  const stats = useMemo(() => {
    if (!command) return { totalWeight: 0, totalValue: 0 };

    return {
      totalWeight: command.items.reduce((sum, item) => {
        return sum + (item.article?.weight || 0) * item.quantity;
      }, 0),
      totalValue: command.items.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
      }, 0),
    };
  }, [command]);

  /**
   * Handle back navigation
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <Loading message='Chargement des détails de la commande...' />;
  }

  if (error || !command) {
    return (
      <div className='command-detail command-detail--error'>
        <div className='command-detail__error-container'>
          <AlertCircle size={48} className='command-detail__error-icon' />
          <h2 className='command-detail__error-title'>Erreur</h2>
          <p className='command-detail__error-message'>
            Impossible de charger la commande
          </p>
          <button
            onClick={handleGoBack}
            className='command-detail__error-button'
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='command-detail'>
      <div className='command-detail__header'>
        <button
          onClick={handleGoBack}
          className='command-detail__back-button'
          title='Retour'
        >
          <ArrowLeft size={20} />
        </button>
        <div className='command-detail__header-content'>
          <h1 className='command-detail__title'>{command.reference}</h1>
          <span
            className={`command-detail__status command-detail__status--${getStatusClass(command.status)}`}
          >
            {getStatusLabel(command.status)}
          </span>
        </div>
      </div>

      <div className='command-detail__progress-section'>
        <div className='command-detail__progress-info'>
          <h3 className='command-detail__progress-title'>Préparation</h3>
          <p className='command-detail__progress-count'>
            {preparedCount} / {totalItems} articles
          </p>
        </div>
        <div className='command-detail__progress-bar'>
          <div
            className='command-detail__progress-fill'
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className='command-detail__progress-percentage'>
          {Math.round(progress)}%
        </p>
      </div>

      <section className='command-detail__section'>
        <h2 className='command-detail__section-title'>Informations</h2>
        <div className='command-detail__info-grid'>
          <div className='command-detail__info-card'>
            <p className='command-detail__info-label'>Client</p>
            <p className='command-detail__info-value'>{command.client.name}</p>
            {command.client.address && (
              <p className='command-detail__info-address'>
                {command.client.address}
              </p>
            )}
          </div>

          <div className='command-detail__info-card'>
            <p className='command-detail__info-label'>Opérateur</p>
            <p className='command-detail__info-value'>
              {command.user.firstName} {command.user.lastName}
            </p>
            <p className='command-detail__info-address'>
              {command.user.matricule}
            </p>
          </div>

          {command.truck && (
            <div className='command-detail__info-card'>
              <p className='command-detail__info-label'>Camion</p>
              <p className='command-detail__info-value'>{command.truck.imat}</p>
              <p className='command-detail__info-address'>
                Charge max: {command.truck.maxLoad} kg
              </p>
            </div>
          )}

          <div className='command-detail__info-card'>
            <p className='command-detail__info-label'>Poids total</p>
            <p className='command-detail__info-value'>
              {stats.totalWeight.toFixed(2)} kg
            </p>
          </div>

          <div className='command-detail__info-card'>
            <p className='command-detail__info-label'>Montant</p>
            <p className='command-detail__info-value'>
              {stats.totalValue.toFixed(2)} €
            </p>
          </div>

          <div className='command-detail__info-card'>
            <p className='command-detail__info-label'>Créée le</p>
            <p className='command-detail__info-value'>
              {formatDate(command.commandDate)}
            </p>
          </div>
        </div>
      </section>

      {currentItem && !currentItem.commandItemPreparation?.isPicked && (
        <section className='command-detail__current-item'>
          <div className='command-detail__current-header'>
            <span className='command-detail__current-badge'>
              Article en cours de préparation
            </span>
          </div>

          <div className='command-detail__article-card'>
            <div className='command-detail__article-header'>
              <h3 className='command-detail__article-title'>
                {currentItem.article?.label ||
                  `Article #${currentItem.articleId}`}
              </h3>
              <span className='command-detail__article-ref'>
                {currentItem.article?.reference}
              </span>
            </div>

            <div className='command-detail__article-details'>
              <div className='command-detail__detail-item'>
                <span className='command-detail__detail-label'>Quantité</span>
                <span className='command-detail__detail-value'>
                  {currentItem.quantity} unité
                  {currentItem.quantity > 1 ? 's' : ''}
                </span>
              </div>

              {currentItem.article?.weight && (
                <div className='command-detail__detail-item'>
                  <span className='command-detail__detail-label'>
                    Poids unitaire
                  </span>
                  <span className='command-detail__detail-value'>
                    {currentItem.article.weight} kg
                  </span>
                </div>
              )}

              <div className='command-detail__detail-item'>
                <span className='command-detail__detail-label'>
                  Poids total
                </span>
                <span className='command-detail__detail-value'>
                  {currentItem.article &&
                    (currentItem.article.weight * currentItem.quantity).toFixed(
                      2,
                    )}{' '}
                  kg
                </span>
              </div>

              <div className='command-detail__detail-item'>
                <span className='command-detail__detail-label'>
                  Prix unitaire
                </span>
                <span className='command-detail__detail-value'>
                  {currentItem.unitPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {currentItem.article?.location && (
            <div className='command-detail__location-card'>
              <div className='command-detail__location-header'>
                <MapPin size={20} className='command-detail__location-icon' />
                <h4 className='command-detail__location-title'>Localisation</h4>
              </div>

              <div className='command-detail__location-grid'>
                <div className='command-detail__location-item'>
                  <span className='command-detail__location-label'>
                    Bâtiment
                  </span>
                  <span className='command-detail__location-value'>
                    {currentItem.article.location.building}
                  </span>
                </div>

                <div className='command-detail__location-item'>
                  <span className='command-detail__location-label'>Allée</span>
                  <span className='command-detail__location-value'>
                    {currentItem.article.location.aisle}
                  </span>
                </div>

                <div className='command-detail__location-item'>
                  <span className='command-detail__location-label'>
                    Étagère
                  </span>
                  <span className='command-detail__location-value'>
                    {currentItem.article.location.shelf}
                  </span>
                </div>

                <div className='command-detail__location-item'>
                  <span className='command-detail__location-label'>
                    Cellule
                  </span>
                  <span className='command-detail__location-value'>
                    {currentItem.article.location.cell}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className='command-detail__actions'>
            <button
              onClick={handleItemPrepared}
              disabled={
                currentItem.commandItemPreparation?.isPicked ||
                command.status === 'DELIVERED' ||
                command.status === 'CANCELLED'
              }
              className='command-detail__button command-detail__button--success'
            >
              <Check size={18} />
              Marquer comme préparé
            </button>
          </div>
        </section>
      )}

      <section id='command-summary' className='command-detail__section'>
        <h2 className='command-detail__section-title'>Articles</h2>
        <div className='command-detail__items-list'>
          {command.items.map((item, index) => {
            const isPrepared = item?.commandItemPreparation?.isPicked;

            return (
              <div
                key={item.id}
                className={`command-detail__item-summary ${
                  isPrepared ? 'command-detail__item-summary--prepared' : ''
                } `}
              >
                <div className='command-detail__item-summary-icon'>
                  {isPrepared ? (
                    <Check
                      size={20}
                      className='command-detail__item-prepared-icon'
                    />
                  ) : (
                    <Package size={20} />
                  )}
                </div>

                <div className='command-detail__item-summary-content'>
                  <p className='command-detail__item-summary-title'>
                    {item.article?.label || `Article #${item.articleId}`}
                  </p>
                  <p className='command-detail__item-summary-details'>
                    ×{item.quantity} @ {item.unitPrice.toFixed(2)}€
                  </p>
                </div>

                {isPrepared && (
                  <span className='command-detail__item-summary-badge'>
                    Prêt
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ height: 20 }} />
    </div>
  );
}
