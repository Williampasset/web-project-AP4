import { getShortLabel } from '@utils/location.utils';
import type { DisplayLocation } from '@type/location-view.type';

interface WarehousePlanProps {
  bulkLocations: DisplayLocation[];
  pickLocations: DisplayLocation[];
  prepLocations: DisplayLocation[];
  transitLocations: DisplayLocation[];
  activeBuilding: string | null;
  focusedLocationId: number | null;
  onFocusLocation: (locationId: number) => void;
}

const renderCellCode = (cell: DisplayLocation) =>
  `${cell.building}${cell.aisle}S${cell.shelf}C${cell.cell}`;

const renderBaseCell = (
  cell: DisplayLocation,
  focusedLocationId: number | null,
  onFocusLocation: (locationId: number) => void,
) => {
  const label = cell.articles[0]?.label ?? null;
  const shortLabel = getShortLabel(label);
  const code = renderCellCode(cell);

  return (
    <button
      key={cell.id}
      type='button'
      className={`plan-cell ${cell.status} ${focusedLocationId === cell.id ? 'focused' : ''}`}
      onClick={() => onFocusLocation(cell.id)}
      title={label ? `${code} — ${label}` : `${code} — Vide`}
    >
      <span className='plan-cell__code'>{code}</span>
      {(cell.pendingJobs?.length ?? 0) > 0 && (
        <span className='plan-cell__pending'>En attente</span>
      )}
      {shortLabel ? (
        <span className='plan-cell__label'>{shortLabel}</span>
      ) : (
        <span className='plan-cell__label muted'>Vide</span>
      )}
      {cell.articles.length > 0 && (
        <span className='plan-cell__stock'>{cell.totalStock}u</span>
      )}
    </button>
  );
};

export default function WarehousePlan({
  bulkLocations,
  pickLocations,
  prepLocations,
  transitLocations,
  activeBuilding,
  focusedLocationId,
  onFocusLocation,
}: WarehousePlanProps) {
  return (
    <div className='warehouse-plan'>
      <section className='zone zone-bulk'>
        <h3>BULK — Réserve</h3>
        <div className='zone-grid'>
          {bulkLocations.length > 0 ? (
            bulkLocations.map((cell) =>
              renderBaseCell(cell, focusedLocationId, onFocusLocation),
            )
          ) : (
            <span className='muted'>Aucune cellule BULK</span>
          )}
        </div>
      </section>

      <section className='zone zone-pick'>
        <h3>PICK LOCATIONS</h3>
        <div className='zone-grid'>
          {pickLocations.length > 0 ? (
            pickLocations.map((cell) =>
              renderBaseCell(cell, focusedLocationId, onFocusLocation),
            )
          ) : (
            <span className='muted'>Aucune cellule PICK</span>
          )}
        </div>
      </section>

      <section className='zone zone-prep'>
        <h3>ZONES DE PRÉPARATION — Bâtiment {activeBuilding}</h3>
        <div className='zone-grid zone-grid--prep'>
          {prepLocations.length > 0 ? (
            prepLocations.map((cell, i) => (
              <button
                key={cell.id}
                type='button'
                className={`prep-slot ${cell.articles.length > 0 ? 'prep-slot--occupied' : ''} ${(cell.pendingJobs?.length ?? 0) > 0 ? 'prep-slot--pending' : ''} ${focusedLocationId === cell.id ? 'focused' : ''}`}
                onClick={() => onFocusLocation(cell.id)}
                title={`Zone ${cell.building}-PZ-${String(i + 1).padStart(2, '0')} — ${cell.articles[0]?.label ?? 'Libre'}`}
              >
                <span className='prep-slot__code'>
                  {cell.building}-PZ-{String(i + 1).padStart(2, '0')}
                </span>
                <span className='prep-slot__status'>
                  {(cell.pendingJobs?.length ?? 0) > 0
                    ? 'En attente'
                    : cell.articles.length > 0
                      ? `${cell.articles[0].label.slice(0, 12)}…`
                      : 'Libre'}
                </span>
              </button>
            ))
          ) : (
            <span className='muted'>Aucune zone</span>
          )}
        </div>
      </section>

      <section className='zone zone-inbound'>
        <h3>INBOUND — TRANSIT (Bâtiment {activeBuilding})</h3>
        <div className='zone-grid zone-grid--inbound'>
          {transitLocations.length > 0 ? (
            transitLocations.map((cell, i) => (
              <button
                key={cell.id}
                type='button'
                className={`transit-slot ${cell.articles.length > 0 ? 'transit-slot--occupied' : ''} ${(cell.pendingJobs?.length ?? 0) > 0 ? 'transit-slot--pending' : ''} ${focusedLocationId === cell.id ? 'focused' : ''}`}
                onClick={() => onFocusLocation(cell.id)}
                title={`Transit ${cell.building}-IN-${String(i + 1).padStart(2, '0')} — ${cell.articles[0]?.label ?? 'Libre'}`}
              >
                <span className='transit-slot__code'>
                  {cell.building}-IN-{String(i + 1).padStart(2, '0')}
                </span>
                <span className='transit-slot__status'>
                  {(cell.pendingJobs?.length ?? 0) > 0
                    ? 'En attente'
                    : cell.articles.length > 0
                      ? `${cell.articles[0].label.slice(0, 12)}…`
                      : 'Libre'}
                </span>
              </button>
            ))
          ) : (
            <span className='muted'>Aucune zone</span>
          )}
        </div>
      </section>
    </div>
  );
}
