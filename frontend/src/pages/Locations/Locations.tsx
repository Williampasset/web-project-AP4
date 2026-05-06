import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteZeroStockLocationArticle,
  fetchLocations,
  mergeLocationArticle,
  moveLocationArticle,
} from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import { QRCodeSVG } from 'qrcode.react';
import './Locations.css';

type Building = WarehouseLocation['building'];

export default function Locations() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<number | null>(null);
  const [qrModalLocation, setQrModalLocation] = useState<(typeof mappedLocations)[number] | null>(null);
  const [moveTargetLocationId, setMoveTargetLocationId] = useState<number | null>(null);
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [mergeTargetArticleId, setMergeTargetArticleId] = useState<number | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
    return Array.from(new Set(locations.map((l) => l.building)))
      .filter((b) => b !== 'P')
      .sort((a, b) => a.localeCompare(b));
  }, [locations]);

  const activeBuilding = selectedBuilding ?? buildings[0] ?? null;

  const buildingLocations = useMemo(() => {
    if (!activeBuilding) return [];
    return locations.filter(
      (l) => l.building === activeBuilding && l.zone !== 'PREP' && l.zone !== 'TRANSIT',
    );
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

  const bulkLocations = useMemo(
    () => mappedLocations.filter((l) => l.zone === 'BULK'),
    [mappedLocations],
  );

  const pickLocations = useMemo(
    () => mappedLocations.filter((l) => l.zone === 'PICK'),
    [mappedLocations],
  );

  const prepLocations = useMemo(() => {
    return locations
      .filter((l) => l.zone === 'PREP' && l.building === activeBuilding)
      .sort((a, b) => a.aisle - b.aisle || a.shelf - b.shelf || a.cell - b.cell)
      .map((location) => {
        const totalStock = location.articles.reduce((sum, a) => sum + a.stock, 0);
        const hasLowStock = location.articles.some((a) => a.stock < 10);
        const status = location.articles.length === 0 ? 'empty' : hasLowStock ? 'alert' : 'ok';
        return { ...location, totalStock, status };
      });
  }, [locations, activeBuilding]);

  const transitLocations = useMemo(() => {
    return locations
      .filter((l) => l.zone === 'TRANSIT' && l.building === activeBuilding)
      .sort((a, b) => a.aisle - b.aisle || a.shelf - b.shelf || a.cell - b.cell)
      .map((location) => {
        const totalStock = location.articles.reduce((sum, a) => sum + a.stock, 0);
        const hasLowStock = location.articles.some((a) => a.stock < 10);
        const status = location.articles.length === 0 ? 'empty' : hasLowStock ? 'alert' : 'ok';
        return { ...location, totalStock, status };
      });
  }, [locations, activeBuilding]);

  const focusedLocation =
    mappedLocations.find((cell) => cell.id === focusedLocationId) ??
    prepLocations.find((cell) => cell.id === focusedLocationId) ??
    transitLocations.find((cell) => cell.id === focusedLocationId) ??
    mappedLocations[0] ??
    null;

  const focusedArticle = focusedLocation?.articles?.[0] ?? null;

  useEffect(() => {
    setMoveTargetLocationId(null);
    setMergeTargetArticleId(null);
    setMoveQuantity(1);
    setActionError(null);
  }, [focusedLocationId]);

  const availableMoveTargets = useMemo(() => {
    if (!focusedLocation) return [];
    return locations
      .filter((l) => l.id !== focusedLocation.id && l.articles.length === 0)
      .sort(
        (a, b) =>
          a.building.localeCompare(b.building) ||
          a.aisle - b.aisle ||
          a.shelf - b.shelf ||
          a.cell - b.cell,
      );
  }, [locations, focusedLocation]);

  const availableMergeTargets = useMemo(() => {
    if (!focusedArticle) return [];
    const label = focusedArticle.label.trim().toLowerCase();
    return locations
      .filter(
        (l) =>
          l.articles.length > 0 &&
          l.articles[0].id !== focusedArticle.id &&
          l.articles[0].label.trim().toLowerCase() === label,
      )
      .sort(
        (a, b) =>
          a.building.localeCompare(b.building) ||
          a.aisle - b.aisle ||
          a.shelf - b.shelf ||
          a.cell - b.cell,
      );
  }, [locations, focusedArticle]);

  const formatLoc = (loc: WarehouseLocation) =>
    `${loc.building}-${loc.aisle}-${loc.shelf}-${loc.cell} [${loc.zone}]`;

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['locations', 'warehouse-view'] }),
      queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
      queryClient.invalidateQueries({ queryKey: ['articles'] }),
      queryClient.invalidateQueries({ queryKey: ['articles', 'live-stock'] }),
    ]);
  };

  const handleMove = async () => {
    if (!focusedArticle || !moveTargetLocationId) return;
    const quantity = Math.max(1, Math.min(moveQuantity, focusedArticle.stock));
    setActionError(null);
    setIsActing(true);
    try {
      await moveLocationArticle(focusedArticle.id, moveTargetLocationId, quantity);
      await refreshData();
      setMoveTargetLocationId(null);
      setMoveQuantity(1);
    } catch (e) {
      setActionError((e as Error).message || 'Échec du déplacement');
    } finally {
      setIsActing(false);
    }
  };

  const handleMerge = async () => {
    if (!focusedArticle || !mergeTargetArticleId) return;
    setActionError(null);
    setIsActing(true);
    try {
      await mergeLocationArticle(focusedArticle.id, mergeTargetArticleId);
      await refreshData();
      setMergeTargetArticleId(null);
    } catch (e) {
      setActionError((e as Error).message || 'Échec de la fusion');
    } finally {
      setIsActing(false);
    }
  };

  const handleDeleteZeroStock = async () => {
    if (!focusedArticle || focusedArticle.stock !== 0) return;
    setActionError(null);
    setIsActing(true);
    try {
      await deleteZeroStockLocationArticle(focusedArticle.id);
      await refreshData();
    } catch (e) {
      setActionError((e as Error).message || 'Échec de suppression');
    } finally {
      setIsActing(false);
    }
  };

  const renderCell = (cell: (typeof mappedLocations)[number]) => {
    const label = cell.articles[0]?.label ?? null;
    const shortLabel = label ? (label.length > 16 ? label.slice(0, 15) + '…' : label) : null;
    return (
      <button
        key={cell.id}
        type='button'
        className={`plan-cell ${cell.status} ${focusedLocation?.id === cell.id ? 'focused' : ''}`}
        onClick={() => setFocusedLocationId(cell.id)}
        title={label ? `${cell.building}${cell.aisle}S${cell.shelf}C${cell.cell} — ${label}` : `${cell.building}${cell.aisle}S${cell.shelf}C${cell.cell} — Vide`}
      >
        <span className='plan-cell__code'>{cell.building}{cell.aisle}S{cell.shelf}C{cell.cell}</span>
        {shortLabel
          ? <span className='plan-cell__label'>{shortLabel}</span>
          : <span className='plan-cell__label muted'>Vide</span>}
        {cell.articles.length > 0 && <span className='plan-cell__stock'>{cell.totalStock}u</span>}
      </button>
    );
  };

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

          <section className='zone zone-prep'>
            <h3>ZONES DE PRÉPARATION — Bâtiment {activeBuilding}</h3>
            <div className='zone-grid zone-grid--prep'>
              {prepLocations.length > 0
                ? prepLocations.map((cell, i) => (
                    <button
                      key={cell.id}
                      type='button'
                      className={`prep-slot ${cell.articles.length > 0 ? 'prep-slot--occupied' : ''} ${focusedLocation?.id === cell.id ? 'focused' : ''}`}
                      onClick={() => setFocusedLocationId(cell.id)}
                      title={`Zone ${cell.building}-PZ-${String(i + 1).padStart(2, '0')} — ${cell.articles[0]?.label ?? 'Libre'}`}
                    >
                      <span className='prep-slot__code'>{cell.building}-PZ-{String(i + 1).padStart(2, '0')}</span>
                      <span className='prep-slot__status'>
                        {cell.articles.length > 0 ? cell.articles[0].label.slice(0, 12) + '…' : 'Libre'}
                      </span>
                    </button>
                  ))
                : <span className='muted'>Aucune zone de préparation</span>}
            </div>
          </section>

          <section className='zone zone-office'><strong>OFFICE</strong></section>
          <section className='zone zone-inbound'>
            <h3>INBOUND — TRANSIT (Bâtiment {activeBuilding})</h3>
            <div className='zone-grid zone-grid--inbound'>
              {transitLocations.length > 0
                ? transitLocations.map((cell, i) => (
                    <button
                      key={cell.id}
                      type='button'
                      className={`transit-slot ${cell.articles.length > 0 ? 'transit-slot--occupied' : ''} ${focusedLocation?.id === cell.id ? 'focused' : ''}`}
                      onClick={() => setFocusedLocationId(cell.id)}
                      title={`Transit ${cell.building}-IN-${String(i + 1).padStart(2, '0')} — ${cell.articles[0]?.label ?? 'Libre'}`}
                    >
                      <span className='transit-slot__code'>{cell.building}-IN-{String(i + 1).padStart(2, '0')}</span>
                      <span className='transit-slot__status'>
                        {cell.articles.length > 0 ? cell.articles[0].label.slice(0, 12) + '…' : 'Libre'}
                      </span>
                    </button>
                  ))
                : <span className='muted'>Aucune zone de transit</span>}
            </div>
          </section>
          <section className='zone zone-docks'><strong>DOCK DOORS</strong></section>
        </div>

        <aside className='warehouse-inspector'>
            <h3>Inspecteur cellule</h3>
            {focusedLocation ? (
              <>
                <p className='inspector-ref'>
                  {focusedLocation.building}-{focusedLocation.aisle}-{focusedLocation.shelf}-{focusedLocation.cell}
                  <span className={`zone-badge zone-badge--${focusedLocation.zone.toLowerCase()}`}>{focusedLocation.zone}</span>
                </p>
                <p className='inspector-stock'>
                  Stock total : {focusedLocation.articles.reduce((sum, article) => sum + article.stock, 0)} unités
                </p>
                <button
                  type='button'
                  className='qr-trigger-btn'
                  onClick={() => setQrModalLocation(focusedLocation)}
                >
                  <span>📷</span> Afficher le QR code
                </button>

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
                          setMoveQuantity(
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
                          setMoveTargetLocationId(
                            e.target.value ? Number(e.target.value) : null,
                          )
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
                          !moveTargetLocationId ||
                          moveQuantity < 1 ||
                          moveQuantity > focusedArticle.stock
                        }
                        onClick={handleMove}
                      >
                        Déplacer {moveQuantity} u
                      </button>
                    </div>

                    <div className='inspector-actions__row'>
                      <label>Fusionner avec même article</label>
                      <select
                        value={mergeTargetArticleId ?? ''}
                        onChange={(e) =>
                          setMergeTargetArticleId(
                            e.target.value ? Number(e.target.value) : null,
                          )
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
                        disabled={isActing || !mergeTargetArticleId}
                        onClick={handleMerge}
                      >
                        Fusionner
                      </button>
                    </div>

                    {focusedArticle.stock === 0 && (
                      <div className='inspector-actions__row'>
                        <label>Cellule vide en stock (0 unité)</label>
                        <button
                          type='button'
                          className='inspector-btn inspector-btn--danger'
                          disabled={isActing}
                          onClick={handleDeleteZeroStock}
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
              </>
            ) : (
              <p className='muted'>Aucune cellule disponible.</p>
            )}
        </aside>
      </div>

      {qrModalLocation && (() => {
        const loc = qrModalLocation;
        const code = `${loc.building}${loc.aisle}S${loc.shelf}C${loc.cell}`;
        const articleLabel = loc.articles[0]?.label ?? 'Emplacement vide';
        const qrValue = JSON.stringify({
          id: loc.id,
          code,
          zone: loc.zone,
          article: loc.articles[0]?.reference ?? null,
        });
        return (
          <div className='qr-modal-overlay' onClick={() => setQrModalLocation(null)}>
            <div className='qr-modal' onClick={(e) => e.stopPropagation()}>
              <div className='qr-modal__header'>
                <h3 className='qr-modal__title'>QR Code — {code}</h3>
                <button className='qr-modal__close' onClick={() => setQrModalLocation(null)}>✕</button>
              </div>
              <p className='qr-modal__sub'>
                <span className={`zone-badge zone-badge--${loc.zone.toLowerCase()}`}>{loc.zone}</span>
                {articleLabel}
              </p>
              <div className='qr-modal__canvas'>
                <QRCodeSVG value={qrValue} size={220} level='M' includeMargin />
              </div>
              <p className='qr-modal__hint'>Scannez ce code pour identifier l'emplacement</p>
            </div>
          </div>
        );
      })()}
    </DefaultLayout>
  );
}