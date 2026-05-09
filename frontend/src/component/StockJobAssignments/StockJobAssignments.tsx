import { useState } from 'react';
import Loading from '@component/Loading/Loading';
import {
  useStockJobsForAssignment,
  useUpdateStockJobAssignment,
} from '../../hooks/assignments.hooks';
import { useUsers } from '../../hooks/users.hooks';
import type { StockJobAssignmentData } from '../../service/api/assignments.service';
import { AlertCircle, Inbox } from 'lucide-react';

export default function StockJobAssignments() {
  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useStockJobsForAssignment();
  const { data: users = [] } = useUsers();
  const updateMutation = useUpdateStockJobAssignment();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const magasiniers = users.filter((u) => u.role === 'MAGASINIER');

  const handleAssign = async (jobId: number, newUserId: number) => {
    setUpdatingId(jobId);
    try {
      await updateMutation.mutateAsync({
        jobId,
        data: { assignedUserId: newUserId },
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'MOVE' ? 'Déplacement' : 'Fusion';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Complété',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#fbbf24',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const formatLocation = (loc?: any) => {
    if (!loc) return '—';
    return `${loc.building}-${loc.aisle}-${loc.shelf}-${loc.cell}`;
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
        <h3>Affectation des Travaux de Stock</h3>
        <span className='assignments-count'>{jobs.length} travaux</span>
      </div>

      {jobs.length === 0 ? (
        <div className='assignments-empty'>
          {isError ? (
            <>
              <p className='assignments-empty-title'>
                <AlertCircle size={18} />
                <span>Erreur de chargement</span>
              </p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                {(error as Error)?.message ||
                  'Les données ne sont pas disponibles'}
              </p>
            </>
          ) : (
            <p className='assignments-empty-title'>
              <Inbox size={18} />
              <span>Aucun travail de stock à affecter pour le moment.</span>
            </p>
          )}
        </div>
      ) : (
        <div className='assignments-table-wrap'>
          <table className='assignments-table'>
            <thead>
              <tr>
                <th>Type</th>
                <th>Article</th>
                <th>Quantité</th>
                <th>Destination</th>
                <th>Statut</th>
                <th>Assigné à</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: StockJobAssignmentData) => (
                <tr key={job.id}>
                  <td>{getTypeLabel(job.type)}</td>
                  <td>
                    <div className='assignments-article'>
                      <strong>{job.sourceArticle.reference}</strong>
                      <br />
                      <span className='assignments-muted'>
                        {job.sourceArticle.label}
                      </span>
                    </div>
                  </td>
                  <td className='assignments-center'>{job.quantity}</td>
                  <td className='assignments-center'>
                    {formatLocation(job.targetLocation)}
                  </td>
                  <td>
                    <span
                      className='assignments-status'
                      style={{ backgroundColor: getStatusColor(job.status) }}
                    >
                      {getStatusLabel(job.status)}
                    </span>
                  </td>
                  <td>
                    {job.assignedUser ? (
                      <div className='assignments-user'>
                        {job.assignedUser.firstName} {job.assignedUser.lastName}
                        <br />
                        <span className='assignments-muted'>
                          {job.assignedUser.matricule}
                        </span>
                      </div>
                    ) : (
                      <span className='assignments-muted'>Non assigné</span>
                    )}
                  </td>
                  <td>
                    <select
                      className='assignments-select'
                      value={job.assignedUserId || ''}
                      onChange={(e) =>
                        handleAssign(job.id, parseInt(e.target.value))
                      }
                      disabled={updatingId === job.id}
                    >
                      <option value=''>Choisir...</option>
                      {magasiniers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
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
