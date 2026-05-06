import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLocations } from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import './Locations.css';

type Building = WarehouseLocation['building'];

export default function Locations() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<number | null>(null);

  const {
    data: locations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<WarehouseLocation[]>({
    queryKey: ['locations', 'warehouse-view'],
    queryFn: fetchLocations,
    refetchInterval: 15000,
  });

  const buildings = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.building))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [locations]);

  const activeBuilding = selectedBuilding ?? buildings[0] ?? null;

  const buildingLocations = useMemo(() => {
    if (!activeBuilding) return [];
    return locations.filter((l) => l.building === activeBuilding);
  }, [locations, activeBuilding]);

  const mappedLocations = useMemo(() => {
    return [...buildingLocations]
      .sort((a, b) => a.aisle - b.aisle || a.shelf - b.shelf || a.cell - b.cell)
      .map((location) => {
        const totalStock = location.articles.reduce((sum, article) => sum + article.stock, 0);
        const hasLowStock = location.articles.some((article) => article.stock < 10);
        const status =
          location.articles.length === 0 ? 'empty' : hasLowStock ? 'alert' : 'ok';

        return {
          ...location,
          totalStock,
          status,
        };
      });
  }, [buildingLocations]);

  const focusedLocation =
    mappedLocations.find((cell) => cell.id === focusedLocationId) ?? mappedLocations[0] ?? null;

  const bulkLocations = useMemo(
    () => mappedLocations.filter((l) => l.zone === 'BULK'),
    [mappedLocations],
  );

  const pickLocations = useMemo(
    () => mappedLocations.filter((l) => l.zone === 'PICK'),
    [mappedLocations],
  );

  const renderCell = (cell: (typeof mappedLocations)[number], compact = false) => (
    <button
      key={cell.id}
      type='button'
      className={`plan-cell ${cell.status} ${focusedLocation?.id === cell.id ? 'focused' : ''} ${compact ? 'compact' : ''}`}
      onClick={() => setFocusedLocationId(cell.id)}
      title={`${cell.building}-${cell.aisle}-${cell.shelf}-${cell.cell}`}
    >
      <span className='plan-cell__code'>{cell.building}{cell.aisle}S{cell.shelf}C{cell.cell}</span>
      <span className='plan-cell__stock'>{cell.totalStock}u</span>
    </button>
  );

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='locations-error'>
          <p>Erreur : {(error as Error)?.message ?? 'Impossible de charger les emplacements.'}</p>
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
          <p>Visualisation spatiale type blueprint avec cellules dispatchées par zone.</p>
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
          <span><i className='dot dot--empty' /> Vide</span>
          <span><i className='dot dot--ok' /> Occupé</span>
          <span><i className='dot dot--alert' /> Stock faible (article &lt; 10)</span>
        </div>

        <div className='warehouse-plan'>
          <section className='zone zone-bulk'>
            <h3>BULK — Réserve</h3>
            <div className='zone-grid'>
              {bulkLocations.length > 0
                ? bulkLocations.map((cell) => renderCell(cell))
                : <span className='muted'>Aucune cellule BULK</span>}
            </div>
          </section>

          <section className='zone zone-pick'>
            <h3>PICK LOCATIONS</h3>
            <div className='zone-grid'>
              {pickLocations.length > 0
                ? pickLocations.map((cell) => renderCell(cell))
                : <span className='muted'>Aucune cellule PICK</span>}
            </div>
          </section>

          <section className='zone zone-office'><strong>OFFICE</strong></section>
          <section className='zone zone-inbound'><strong>INBOUND</strong></section>
          <section className='zone zone-docks'><strong>DOCK DOORS</strong></section>
        </div>

        <aside className='warehouse-inspector'>
            <h3>Inspecteur cellule</h3>
            {focusedLocation ? (
              <>
                <p className='inspector-ref'>
                  {focusedLocation.building}-{focusedLocation.aisle}-{focusedLocation.shelf}-{focusedLocation.cell}
                </p>
                <p className='inspector-stock'>
                  Stock total : {focusedLocation.articles.reduce((sum, article) => sum + article.stock, 0)} unités
                </p>
                <div className='inspector-articles'>
                  {focusedLocation.articles.length === 0 ? (
                    <span className='muted'>Aucun article stocké.</span>
                  ) : (
                    focusedLocation.articles.map((article) => (
                      <div key={article.id} className='inspector-article-row'>
                        <span>{article.reference} · {article.label}</span>
                        <strong>{article.stock}</strong>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className='muted'>Aucune cellule disponible.</p>
            )}
        </aside>
      </div>
    </DefaultLayout>
  );
}