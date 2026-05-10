import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStockHistory } from '@service/api/stock-history.service';
import type { StockHistoryEntry } from '@type/stock-history.type';
import './StockHistory.css';

const eventLabel: Record<StockHistoryEntry['eventType'], string> = {
  SUPPLIER_INBOUND: 'Entrée fournisseur',
  COMMAND_SHIPMENT: 'Envoi commande',
  COMMAND_REVERT: 'Annulation commande',
  MOVE_VALIDATED: 'Déplacement validé',
  MERGE_VALIDATED: 'Fusion validée',
  CELL_CLEARED: 'Cellule libérée',
};

const eventClass: Record<StockHistoryEntry['eventType'], string> = {
  SUPPLIER_INBOUND: 'history-badge history-badge--in',
  COMMAND_SHIPMENT: 'history-badge history-badge--out',
  COMMAND_REVERT: 'history-badge history-badge--revert',
  MOVE_VALIDATED: 'history-badge history-badge--move',
  MERGE_VALIDATED: 'history-badge history-badge--merge',
  CELL_CLEARED: 'history-badge history-badge--clear',
};

export default function StockHistory() {
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StockHistoryEntry[]>({
    queryKey: ['stock-history'],
    queryFn: fetchStockHistory,
    refetchInterval: 15000,
  });

  const stats = useMemo(() => {
    const inbound = entries.filter(
      (e) => e.eventType === 'SUPPLIER_INBOUND',
    ).length;
    const outbound = entries.filter(
      (e) => e.eventType === 'COMMAND_SHIPMENT',
    ).length;
    return { inbound, outbound };
  }, [entries]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='stock-history-error'>
          <h2>Erreur de chargement</h2>
          <p>
            {(error as Error)?.message ??
              "Impossible de charger l'historique stock."}
          </p>
          <button onClick={() => refetch()}>Réessayer</button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='stock-history-page'>
        <div className='stock-history-header'>
          <h1>Historique des mouvements de stock</h1>
          <p>
            {entries.length} événement{entries.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className='stock-history-kpis'>
          <div className='kpi kpi--in'>
            <span>Entrées fournisseurs</span>
            <strong>{stats.inbound}</strong>
          </div>
          <div className='kpi kpi--out'>
            <span>Envois commandes</span>
            <strong>{stats.outbound}</strong>
          </div>
        </div>

        <div className='stock-history-table-wrap'>
          <table className='stock-history-table'>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Article</th>
                <th>Qté</th>
                <th>Origine</th>
                <th>Destination</th>
                <th>Réf. liée</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className='empty-state'>
                    Aucun événement enregistré.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString('fr-FR')}</td>
                    <td>
                      <span className={eventClass[entry.eventType]}>
                        {eventLabel[entry.eventType]}
                      </span>
                    </td>
                    <td>
                      <div className='article-ref'>
                        {entry.articleReference ?? '—'}
                      </div>
                      <small className='article-label'>
                        {entry.articleLabel ?? '—'}
                      </small>
                    </td>
                    <td>{entry.quantity}</td>
                    <td>{entry.fromLocationName ?? '—'}</td>
                    <td>{entry.toLocationName ?? '—'}</td>
                    <td>
                      {entry.supplierName
                        ? `${entry.supplierName}`
                        : entry.commandRef
                          ? `${entry.commandRef}`
                          : entry.jobId
                            ? `JOB #${entry.jobId}`
                            : '—'}
                    </td>
                    <td>{entry.note ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DefaultLayout>
  );
}
