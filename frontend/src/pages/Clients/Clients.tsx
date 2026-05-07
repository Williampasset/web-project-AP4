import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useMemo, useState } from 'react';
import { useClients } from '../../hooks/clients.hooks';
import './Clients.css';

export default function Clients() {
  const [search, setSearch] = useState('');
  const {
    data: clients = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useClients();

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
                        <span className='clients-badge clients-badge--waiting'>
                          WAITING: {waiting}
                        </span>
                        <span className='clients-badge clients-badge--pending'>
                          PENDING: {pending}
                        </span>
                        <span className='clients-badge clients-badge--delivered'>
                          DELIVERED: {delivered}
                        </span>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
