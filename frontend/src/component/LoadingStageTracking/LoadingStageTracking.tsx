import { useState } from 'react';
import Loading from '@component/Loading/Loading';
import {
  useLoadingStages,
  useUpdateLoadingStage,
} from '../../hooks/assignments.hooks';
import type { LoadingStageData } from '../../service/api/assignments.service';

export default function LoadingStageTracking() {
  const { data: stages = [], isLoading, isError, error } = useLoadingStages();
  const updateMutation = useUpdateLoadingStage();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (
    stageId: number,
    newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
  ) => {
    setUpdatingId(stageId);
    try {
      await updateMutation.mutateAsync({
        stageId,
        data: { status: newStatus },
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      PREPARATION: 'Préparation',
      LOADING_ZONE: 'Zone de chargement',
      LOADING_TRUCK: 'Chargement camion',
      LOADED: 'Chargé',
    };
    return labels[stage] || stage;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Complété',
      FAILED: 'Échoué',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#fbbf24',
      IN_PROGRESS: '#3b82f6',
      COMPLETED: '#10b981',
      FAILED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className='assignment-error'>
        <p>{(error as Error)?.message || 'Erreur de chargement'}</p>
      </div>
    );
  }

  return (
    <div className='assignments-tab'>
      <div className='assignments-header'>
        <h3>Suivi des Étapes de Chargement</h3>
        <span className='assignments-count'>{stages.length} étape(s)</span>
      </div>

      {stages.length === 0 ? (
        <div className='assignments-empty'>
          {isError ? (
            <>
              <p>❌ Erreur de chargement</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                {(error as Error)?.message || 'Les données ne sont pas disponibles'}
              </p>
            </>
          ) : (
            <p>📭 Aucune étape de chargement pour le moment.</p>
          )}
        </div>
      ) : (
        <div className='assignments-table-wrap'>
          <table className='assignments-table'>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Étape</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage: LoadingStageData) => (
                <tr key={stage.id}>
                  <td className='assignments-reference'>
                    {stage.commandReference}
                  </td>
                  <td>{stage.clientName}</td>
                  <td>{getStageLabel(stage.stage)}</td>
                  <td>
                    <span
                      className='assignments-status'
                      style={{ backgroundColor: getStatusColor(stage.status) }}
                    >
                      {getStatusLabel(stage.status)}
                    </span>
                  </td>
                  <td>
                    {stage.startedAt ? (
                      <span className='assignments-muted'>
                        {new Date(stage.startedAt).toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {stage.completedAt ? (
                      <span className='assignments-muted'>
                        {new Date(stage.completedAt).toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <select
                      className='assignments-select'
                      value={stage.status}
                      onChange={(e) =>
                        handleStatusChange(
                          stage.id,
                          e.target.value as
                            | 'PENDING'
                            | 'IN_PROGRESS'
                            | 'COMPLETED'
                            | 'FAILED',
                        )
                      }
                      disabled={updatingId === stage.id}
                    >
                      <option value='PENDING'>En attente</option>
                      <option value='IN_PROGRESS'>En cours</option>
                      <option value='COMPLETED'>Complété</option>
                      <option value='FAILED'>Échoué</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
