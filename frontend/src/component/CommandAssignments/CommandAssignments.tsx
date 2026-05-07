import { useState } from 'react';
import Loading from '@component/Loading/Loading';
import {
  useCommandsForAssignment,
  useUpdateCommandAssignment,
} from '../../hooks/assignments.hooks';
import { useUsers } from '../../hooks/users.hooks';
import type { CommandAssignmentData } from '../../service/api/assignments.service';

export default function CommandAssignments() {
  const { data: commands = [], isLoading, isError, error } = useCommandsForAssignment();
  const { data: users = [] } = useUsers();
  const updateMutation = useUpdateCommandAssignment();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const magasiniers = users.filter((u) => u.role === 'MAGASINIER');

  const handleAssign = async (
    commandId: number,
    newUserId: number,
  ) => {
    setUpdatingId(commandId);
    try {
      await updateMutation.mutateAsync({
        commandId,
        data: { userId: newUserId },
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      WAITING: 'En attente',
      PENDING: 'En cours',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      WAITING: '#fbbf24',
      PENDING: '#3b82f6',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
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
        <h3>Affectation des Commandes</h3>
        <span className='assignments-count'>{commands.length} commande(s)</span>
      </div>

      {commands.length === 0 ? (
        <div className='assignments-empty'>Aucune commande à affecter.</div>
      ) : (
        <div className='assignments-table-wrap'>
          <table className='assignments-table'>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Statut</th>
                <th>Assigné à</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd: CommandAssignmentData) => (
                <tr key={cmd.id}>
                  <td className='assignments-reference'>{cmd.reference}</td>
                  <td>{cmd.clientName}</td>
                  <td className='assignments-center'>{cmd.itemsCount}</td>
                  <td>
                    <span
                      className='assignments-status'
                      style={{ backgroundColor: getStatusColor(cmd.status) }}
                    >
                      {getStatusLabel(cmd.status)}
                    </span>
                  </td>
                  <td>
                    {cmd.user ? (
                      <div className='assignments-user'>
                        {cmd.user.firstName} {cmd.user.lastName}
                        <br />
                        <span className='assignments-muted'>
                          {cmd.user.matricule}
                        </span>
                      </div>
                    ) : (
                      <span className='assignments-muted'>Non assigné</span>
                    )}
                  </td>
                  <td>
                    <select
                      className='assignments-select'
                      value={cmd.userId || ''}
                      onChange={(e) =>
                        handleAssign(cmd.id, parseInt(e.target.value))
                      }
                      disabled={updatingId === cmd.id}
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
