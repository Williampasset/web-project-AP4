import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useMemo, useState } from 'react';
import {
  useUsers,
  useCreateUser,
  useDeleteUser,
} from '../../hooks/users.hooks';
import { useCommands } from '../../hooks/commands.hooks';
import { useStockJobsForAssignment } from '../../hooks/assignments.hooks';
import UserModal from '@component/UserModal/UserModal';
import DeleteConfirmModal from '@component/DeleteConfirmModal/DeleteConfirmModal';
import type { User } from '@type/user.type';
import './Users.css';
import { TrashIcon } from 'lucide-react';

export default function Users() {
  const [search, setSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isLoading, isError, error, refetch } = useUsers();

  const createMutation = useCreateUser();
  const deleteMutation = useDeleteUser();

  const { data: commands = [] } = useCommands();
  const { data: stockJobs = [] } = useStockJobsForAssignment();

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(normalized) ||
        user.lastName.toLowerCase().includes(normalized) ||
        user.matricule.toLowerCase().includes(normalized),
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const managers = users.filter((u) => u.role === 'MANAGER').length;
    const magasiniers = users.filter((u) => u.role === 'MAGASINIER').length;

    return {
      total: filteredUsers.length,
      managers,
      magasiniers,
    };
  }, [filteredUsers, users]);

  const managers = useMemo(() => {
    return users.filter((u) => u.role === 'MANAGER');
  }, [users]);

  const commandCountByUser = useMemo(() => {
    const map: Record<number, number> = {};
    for (const cmd of commands) {
      if (
        cmd.userId != null &&
        cmd.status !== 'DELIVERED' &&
        cmd.status !== 'CANCELLED'
      ) {
        map[cmd.userId] = (map[cmd.userId] ?? 0) + 1;
      }
    }
    return map;
  }, [commands]);

  const stockJobCountByUser = useMemo(() => {
    const map: Record<number, number> = {};
    for (const job of stockJobs) {
      if (job.status !== 'COMPLETED' && job.status !== 'CANCELLED') {
        map[job.assignedUserId] = (map[job.assignedUserId] ?? 0) + 1;
      }
    }
    return map;
  }, [stockJobs]);

  const handleCloseModal = () => {
    setShowUserModal(false);
  };

  const handleUserSubmit = async (data: {
    matricule: string;
    firstName: string;
    lastName: string;
    password: string;
    role: 'MANAGER' | 'MAGASINIER';
    managerId?: number;
  }) => {
    await createMutation.mutateAsync(data);
  };

  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getRoleLabel = (role: string) => {
    return role === 'MANAGER' ? 'Manager' : 'Magasinier';
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='users-error'>
          <h2>Erreur de chargement</h2>
          <p>
            {(error as Error)?.message ??
              'Impossible de charger les utilisateurs.'}
          </p>
          <button onClick={() => refetch()}>Réessayer</button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='users-page'>
        <div className='users-header'>
          <div>
            <h1>Utilisateurs</h1>
            <p>Gestion du personnel</p>
          </div>
          <button
            className='users-add-btn'
            onClick={() => setShowUserModal(true)}
          >
            + Ajouter un utilisateur
          </button>
        </div>

        <input
          className='users-search'
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Rechercher par nom, prénom ou matricule…'
        />

        <div className='users-kpis'>
          <div className='users-kpi'>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </div>
          <div className='users-kpi'>
            <span>Managers</span>
            <strong>{stats.managers}</strong>
          </div>
          <div className='users-kpi'>
            <span>Magasiniers</span>
            <strong>{stats.magasiniers}</strong>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className='users-empty'>Aucun utilisateur trouvé.</div>
        ) : (
          <div className='users-table-wrap'>
            <table className='users-table'>
              <thead>
                <tr>
                  <th>Identité</th>
                  <th>Matricule</th>
                  <th>Rôle</th>
                  <th>Manager</th>
                  <th>Commandes</th>
                  <th>Tâches stock</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const manager = users.find((u) => u.id === user.managerId);

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className='users-name'>
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td>
                        <div className='users-muted'>{user.matricule}</div>
                      </td>
                      <td>
                        <span
                          className={`users-role-badge users-role-${user.role.toLowerCase()}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        {manager ? (
                          <div className='users-muted'>
                            {manager.firstName} {manager.lastName}
                          </div>
                        ) : (
                          <div className='users-muted'>—</div>
                        )}
                      </td>
                      <td>
                        {user.role === 'MAGASINIER' ? (
                          <span className='users-count-badge'>
                            {commandCountByUser[user.id] ?? 0}
                          </span>
                        ) : (
                          <span className='users-muted'>—</span>
                        )}
                      </td>
                      <td>
                        {user.role === 'MAGASINIER' ? (
                          <span className='users-count-badge users-count-badge--stock'>
                            {stockJobCountByUser[user.id] ?? 0}
                          </span>
                        ) : (
                          <span className='users-muted'>—</span>
                        )}
                      </td>
                      <td>
                        <div className='users-muted'>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td>
                        <div className='users-actions'>
                          <button
                            type='button'
                            className='users-action-btn users-action-delete'
                            onClick={() => handleDeleteClick(user)}
                            title='Supprimer'
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        isOpen={showUserModal}
        onClose={handleCloseModal}
        onSubmit={handleUserSubmit}
        isLoading={createMutation.isPending}
        managers={managers}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        userName={
          deleteTarget
            ? `${deleteTarget.firstName} ${deleteTarget.lastName}`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </DefaultLayout>
  );
}
