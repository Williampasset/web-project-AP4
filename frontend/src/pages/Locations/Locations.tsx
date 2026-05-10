import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import LocationQrModal from '@component/LocationQrModal/LocationQrModal';
import WarehouseInspector from '@component/WarehouseInspector/WarehouseInspector';
import WarehousePlan from '@component/WarehousePlan/WarehousePlan';
import { useLocationsPage } from './useLocationsPage';
import './Locations.css';

export default function Locations() {
  const {
    isLoading,
    isError,
    error,
    refetch,
    users,
    buildings,
    activeBuilding,
    bulkLocations,
    pickLocations,
    prepLocations,
    transitLocations,
    focusedLocation,
    prepAssigneeNamesByLocationId,
    focusedPrepAssigneeName,
    qrModalLocation,
    assignedUserId,
    isActing,
    actionError,
    moveQuantity,
    moveTargetLocationId,
    mergeTargetArticleId,
    availableMoveTargets,
    availableMergeTargets,
    setSelectedBuilding,
    setFocusedLocationId,
    setQrModalLocation,
    setAssignedUserId,
    setMoveQuantity,
    setMoveTargetLocationId,
    setMergeTargetArticleId,
    handleMove,
    handleMerge,
    handleValidateJob,
    handleDeleteZeroStock,
    handleAssignPrepZoneWorker,
  } = useLocationsPage();

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='locations-error'>
          <h2>Erreur de chargement</h2>
          <p>
            {(error as Error)?.message ??
              'Impossible de charger les emplacements.'}
          </p>
          <button onClick={() => refetch()}>Réessayer</button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='locations-page'>
        <div className='locations-header'>
          <h1>Plan d'entrepôt simulé</h1>
          <p>
            Visualisation spatiale type blueprint avec cellules dispatchées par
            zone.
          </p>
        </div>

        <div className='locations-tabs'>
          {buildings.map((building) => (
            <button
              key={building}
              type='button'
              className={`locations-tab ${activeBuilding === building ? 'active' : ''}`}
              onClick={() => setSelectedBuilding(building)}
            >
              Bâtiment {building}
            </button>
          ))}
        </div>

        <div className='warehouse-legend'>
          <span>
            <i className='dot dot--empty' /> Vide
          </span>
          <span>
            <i className='dot dot--ok' /> Occupé
          </span>
          <span>
            <i className='dot dot--alert' /> Stock faible (article &lt; 10)
          </span>
          <span>
            <i className='dot dot--pending' /> En attente d'action
          </span>
        </div>

        <WarehousePlan
          bulkLocations={bulkLocations}
          pickLocations={pickLocations}
          prepLocations={prepLocations}
          transitLocations={transitLocations}
          prepAssigneesByLocationId={prepAssigneeNamesByLocationId}
          activeBuilding={activeBuilding}
          focusedLocationId={focusedLocation?.id ?? null}
          onFocusLocation={setFocusedLocationId}
        />

        <WarehouseInspector
          focusedLocation={focusedLocation}
          users={users}
          assignedUserId={assignedUserId}
          isActing={isActing}
          actionError={actionError}
          focusedPrepAssigneeName={focusedPrepAssigneeName}
          moveQuantity={moveQuantity}
          moveTargetLocationId={moveTargetLocationId}
          mergeTargetArticleId={mergeTargetArticleId}
          availableMoveTargets={availableMoveTargets}
          availableMergeTargets={availableMergeTargets}
          onAssignedUserChange={setAssignedUserId}
          onMoveQuantityChange={setMoveQuantity}
          onMoveTargetChange={setMoveTargetLocationId}
          onMergeTargetChange={setMergeTargetArticleId}
          onShowQr={() => setQrModalLocation(focusedLocation)}
          onMove={handleMove}
          onMerge={handleMerge}
          onValidateJob={handleValidateJob}
          onDeleteZeroStock={handleDeleteZeroStock}
          onAssignPrepWorker={handleAssignPrepZoneWorker}
        />
      </div>

      <LocationQrModal
        location={qrModalLocation}
        onClose={() => setQrModalLocation(null)}
      />
    </DefaultLayout>
  );
}
