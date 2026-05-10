import type { User } from '@type/user.type';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import { formatLoc } from '@utils/location.utils';
import type { DisplayLocation } from '@type/location-view.type';

interface WarehouseInspectorProps {
  focusedLocation: DisplayLocation | null;
  users: User[];
  assignedUserId: number | null;
  isActing: boolean;
  actionError: string | null;
  focusedPrepAssigneeName: string | null;
  moveQuantity: number;
  moveTargetLocationId: number | null;
  mergeTargetArticleId: number | null;
  availableMoveTargets: WarehouseLocation[];
  availableMergeTargets: WarehouseLocation[];
  onAssignedUserChange: (id: number | null) => void;
  onMoveQuantityChange: (qty: number) => void;
  onMoveTargetChange: (id: number | null) => void;
  onMergeTargetChange: (id: number | null) => void;
  onShowQr: () => void;
  onMove: () => void;
  onMerge: () => void;
  onValidateJob: (jobId: number, userId: number) => void;
  onDeleteZeroStock: () => void;
  onAssignPrepWorker: () => void;
}

export default function WarehouseInspector({
  focusedLocation,
  users,
  assignedUserId,
  isActing,
  actionError,
  focusedPrepAssigneeName,
  moveQuantity,
  moveTargetLocationId,
  mergeTargetArticleId,
  availableMoveTargets,
  availableMergeTargets,
  onAssignedUserChange,
  onMoveQuantityChange,
  onMoveTargetChange,
  onMergeTargetChange,
  onShowQr,
  onMove,
  onMerge,
  onValidateJob,
  onDeleteZeroStock,
  onAssignPrepWorker,
}: WarehouseInspectorProps) {
  if (!focusedLocation) {
    return (
      <aside className='warehouse-inspector'>
        <h3>Inspecteur cellule</h3>
        <p className='muted'>Aucune cellule disponible.</p>
      </aside>
    );
  }

  const focusedArticle = focusedLocation.articles[0] ?? null;
  const pendingJobs = focusedLocation.pendingJobs ?? [];
  const hasPendingJobs = pendingJobs.length > 0;

  return (
    <aside className='warehouse-inspector'>
      <h3>Inspecteur cellule</h3>
      <p className='inspector-ref'>
        {focusedLocation.building}-{focusedLocation.aisle}-{focusedLocation.shelf}-
        {focusedLocation.cell}
        <span className={`zone-badge zone-badge--${focusedLocation.zone.toLowerCase()}`}>
          {focusedLocation.zone}
        </span>
      </p>
      <p className='inspector-stock'>
        Stock total :{' '}
        {focusedLocation.articles.reduce((sum, article) => sum + article.stock, 0)}{' '}
        unités
      </p>
      <button type='button' className='qr-trigger-btn' onClick={onShowQr}>
        Afficher le QR code
      </button>

      <div className='inspector-actions'>
        <h4>Affectation employé</h4>
        <div className='inspector-actions__row'>
          <label>Employé assigné pour nouvelle tâche</label>
          <select
            value={assignedUserId ?? ''}
            onChange={(e) =>
              onAssignedUserChange(e.target.value ? Number(e.target.value) : null)
            }
            disabled={isActing}
          >
            <option value=''>Sélectionner un employé</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.matricule})
              </option>
            ))}
          </select>
        </div>
        {focusedLocation.zone === 'PREP' && (
          <div className='inspector-actions__row'>
            <label>Affecter à cette zone de préparation</label>
            <button
              type='button'
              className='inspector-btn inspector-btn--prep'
              disabled={isActing || !assignedUserId}
              onClick={onAssignPrepWorker}
            >
              Affecter le magasinier
            </button>
            <small className='inspector-assignee'>
              {focusedPrepAssigneeName
                ? `Actuellement: ${focusedPrepAssigneeName}`
                : 'Aucun magasinier affecté'}
            </small>
          </div>
        )}
      </div>

      {hasPendingJobs && (
        <div className='inspector-actions inspector-actions--pending'>
          <h4>Jobs en attente sur cette cellule</h4>
          {pendingJobs.map((job) => (
            <div key={job.id} className='pending-job'>
              <div className='pending-job__meta'>
                <strong>#{job.id}</strong> · {job.type} · {job.quantity}u
                <br />
                Assigné à {job.assignedUser.firstName} {job.assignedUser.lastName}
              </div>
              <button
                type='button'
                className='inspector-btn inspector-btn--pending'
                disabled={isActing}
                onClick={() => onValidateJob(job.id, job.assignedUser.id)}
              >
                Valider (par {job.assignedUser.matricule})
              </button>
            </div>
          ))}
        </div>
      )}

      {focusedArticle && (
        <div className='inspector-actions'>
          <h4>Actions cellule</h4>

          <div className='inspector-actions__row'>
            <label>Déplacer vers cellule vide</label>
            <input
              type='number'
              min={1}
              max={focusedArticle.stock}
              value={moveQuantity}
              onChange={(e) =>
                onMoveQuantityChange(
                  Math.max(
                    1,
                    Math.min(
                      focusedArticle.stock,
                      Number.parseInt(e.target.value || '1', 10) || 1,
                    ),
                  ),
                )
              }
              disabled={isActing}
            />
            <select
              value={moveTargetLocationId ?? ''}
              onChange={(e) =>
                onMoveTargetChange(e.target.value ? Number(e.target.value) : null)
              }
              disabled={isActing || availableMoveTargets.length === 0}
            >
              <option value=''>Sélectionner une cellule</option>
              {availableMoveTargets.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {formatLoc(loc)}
                </option>
              ))}
            </select>
            <button
              type='button'
              className='inspector-btn'
              disabled={
                isActing ||
                hasPendingJobs ||
                !assignedUserId ||
                !moveTargetLocationId ||
                moveQuantity < 1 ||
                moveQuantity > focusedArticle.stock
              }
              onClick={onMove}
            >
              Créer job déplacement ({moveQuantity} u)
            </button>
          </div>

          <div className='inspector-actions__row'>
            <label>Fusionner avec même article</label>
            <select
              value={mergeTargetArticleId ?? ''}
              onChange={(e) =>
                onMergeTargetChange(e.target.value ? Number(e.target.value) : null)
              }
              disabled={isActing || availableMergeTargets.length === 0}
            >
              <option value=''>Sélectionner une cellule</option>
              {availableMergeTargets.map((loc) => (
                <option key={loc.id} value={loc.articles[0].id}>
                  {formatLoc(loc)} ({loc.articles[0].stock}u)
                </option>
              ))}
            </select>
            <button
              type='button'
              className='inspector-btn inspector-btn--merge'
              disabled={
                isActing || hasPendingJobs || !assignedUserId || !mergeTargetArticleId
              }
              onClick={onMerge}
            >
              Créer job fusion
            </button>
          </div>

          {focusedArticle.stock === 0 && (
            <div className='inspector-actions__row'>
              <label>Cellule vide en stock (0 unité)</label>
              <button
                type='button'
                className='inspector-btn inspector-btn--danger'
                disabled={isActing}
                onClick={onDeleteZeroStock}
              >
                Supprimer le contenu (libérer cellule)
              </button>
            </div>
          )}

          {actionError && <p className='inspector-actions__error'>{actionError}</p>}
        </div>
      )}

      <div className='inspector-articles'>
        {focusedLocation.articles.length === 0 ? (
          <span className='muted'>Aucun article stocké.</span>
        ) : (
          focusedLocation.articles.map((article) => (
            <div key={article.id} className='inspector-article-row'>
              <div>
                <span className='inspector-article-ref'>{article.reference}</span>
                <span className='inspector-article-label'>{article.label}</span>
              </div>
              <strong>{article.stock}</strong>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
