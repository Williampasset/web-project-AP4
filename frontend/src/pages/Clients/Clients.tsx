import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../../hooks/clients.hooks';
import ClientModal from '@component/ClientModal/ClientModal';
import ClientDeleteConfirmModal from '@component/ClientDeleteConfirmModal/ClientDeleteConfirmModal';
import type { Client } from '@type/client.type';
import './Clients.css';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const {
    data: clients = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useClients();

  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(normalized) ||
        client.address.toLowerCase().includes(normalized) ||
        client.email?.toLowerCase().includes(normalized) ||
        client.commands.some((command) =>
          command.reference.toLowerCase().includes(normalized),
        ),
    );
  }, [clients, search]);

  const globalStats = useMemo(() => {
    const totalCommands = filteredClients.reduce(
      (sum, c) => sum + c.commands.length,
      0,
    );
    const delivered = filteredClients.reduce(
      (sum, c) =>
        sum + c.commands.filter((cmd) => cmd.status === 'DELIVERED').length,
      0,
    );
    const waiting = filteredClients.reduce(
      (sum, c) =>
        sum + c.commands.filter((cmd) => cmd.status === 'WAITING').length,
      0,
    );
    const pending = filteredClients.reduce(
      (sum, c) =>
        sum + c.commands.filter((cmd) => cmd.status === 'PENDING').length,
      0,
    );

    return {
      totalClients: filteredClients.length,
      totalCommands,
      delivered,
      waiting,
      pending,
    };
  }, [filteredClients]);

  const handleOpenModal = (client?: Client) => {
    setEditingClient(client || null);
    setShowClientModal(true);
  };

  const handleCloseModal = () => {
    setShowClientModal(false);
    setEditingClient(null);
  };

  const handleClientSubmit = async (data: {
    name: string;
    address: string;
    email: string;
    phone: string;
  }) => {
    if (editingClient) {
      await updateMutation.mutateAsync({
        id: editingClient.id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteClick = (client: Client) => {
    setDeleteTarget(client);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='clients-error'>
          <h2>Erreur de chargement</h2>
          <p>{(error as Error)?.message ?? 'Impossible de charger les clients.'}</p>
          <button onClick={() => refetch()}>Réessayer</button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='clients-page'>
        <div className='clients-header'>
          <div>
            <h1>Clients</h1>
            <p>Suivi des clients et de leurs commandes</p>
          </div>
          <button
            className='clients-add-btn'
            onClick={() => handleOpenModal()}
          >
            + Ajouter un client
          </button>
        </div>

        <input
          className='clients-search'
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Rechercher par nom, email, adresse ou référence commande…'
        />

        <div className='clients-kpis'>
          <div className='clients-kpi'>
            <span>Clients</span>
            <strong>{globalStats.totalClients}</strong>
          </div>
          <div className='clients-kpi'>
            <span>Commandes</span>
            <strong>{globalStats.totalCommands}</strong>
          </div>
          <div className='clients-kpi'>
            <span>Livrées</span>
            <strong>{globalStats.delivered}</strong>
          </div>
          <div className='clients-kpi'>
            <span>En cours</span>
            <strong>{globalStats.waiting + globalStats.pending}</strong>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className='clients-empty'>Aucun client trouvé.</div>
        ) : (
          <div className='clients-table-wrap'>
            <table className='clients-table'>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Commandes</th>
                  <th>Statuts</th>
                  <th>Dernière commande</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const waiting = client.commands.filter(
                    (cmd) => cmd.status === 'WAITING',
                  ).length;
                  const pending = client.commands.filter(
                    (cmd) => cmd.status === 'PENDING',
                  ).length;
                  const delivered = client.commands.filter(
                    (cmd) => cmd.status === 'DELIVERED',
                  ).length;
                  const latest = [...client.commands].sort(
                    (a, b) =>
                      new Date(b.commandDate).getTime() -
                      new Date(a.commandDate).getTime(),
                  )[0];

                  return (
                    <tr key={client.id}>
                      <td>
                        <div className='clients-name'>{client.name}</div>
                        <div className='clients-muted'>{client.address}</div>
                      </td>
                      <td>
                        <div>{client.email ?? '—'}</div>
                        <div className='clients-muted'>{client.phone ?? '—'}</div>
                      </td>
                      <td>{client.commands.length}</td>
                      <td>
                        <button
                          type='button'
                          className='clients-badge clients-badge--waiting'
                          onClick={() =>
                            navigate(
                              `/commands?status=WAITING&search=${encodeURIComponent(client.name)}`,
                            )
                          }
                        >
                          WAITING: {waiting}
                        </button>
                        <button
                          type='button'
                          className='clients-badge clients-badge--pending'
                          onClick={() =>
                            navigate(
                              `/commands?status=PENDING&search=${encodeURIComponent(client.name)}`,
                            )
                          }
                        >
                          PENDING: {pending}
                        </button>
                        <button
                          type='button'
                          className='clients-badge clients-badge--delivered'
                          onClick={() =>
                            navigate(
                              `/commands?status=DELIVERED&search=${encodeURIComponent(client.name)}`,
                            )
                          }
                        >
                          DELIVERED: {delivered}
                        </button>
                      </td>
                      <td>
                        {latest ? (
                          <>
                            <div>{latest.reference}</div>
                            <div className='clients-muted'>
                              {new Date(latest.commandDate).toLocaleString('fr-FR')}
                            </div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className='clients-actions'>
                          <button
                            type='button'
                            className='clients-action-btn clients-action-edit'
                            onClick={() => handleOpenModal(client)}
                            title='Modifier'
                          >
                            ✎
                          </button>
                          <button
                            type='button'
                            className='clients-action-btn clients-action-delete'
                            onClick={() => handleDeleteClick(client)}
                            title='Supprimer'
                          >
                            🗑
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

      <ClientModal
        isOpen={showClientModal}
        client={editingClient}
        onClose={handleCloseModal}
        onSubmit={handleClientSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ClientDeleteConfirmModal
        isOpen={!!deleteTarget}
        clientName={deleteTarget?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </DefaultLayout>
  );
}
