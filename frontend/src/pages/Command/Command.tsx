import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import DefaultLayout from '@component/default/DefaultLayout';
import CommandCard from '@component/CommandCard/CommandCard';
import Loading from '@component/Loading/Loading';
import { useCommands } from '../../hooks/commands.hooks';
import type { CommandStatus } from '@type/command.type';
import './Command.css';

const STATUS_FILTERS: Array<{ value: 'ALL' | CommandStatus; label: string }> = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'WAITING', label: 'En attente' },
  { value: 'PENDING', label: 'En cours' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export default function Command() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommandStatus>('ALL');
  const [search, setSearch] = useState('');

  const { data: commands = [], isLoading, isError, error, refetch } = useCommands(
    statusFilter === 'ALL' ? undefined : { status: statusFilter },
  );

  const filteredCommands = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return commands;
    }

    return commands.filter((command) => {
      const assignedUser = `${command.user.firstName} ${command.user.lastName}`.toLowerCase();
      return (
        command.reference.toLowerCase().includes(normalizedSearch) ||
        command.client.name.toLowerCase().includes(normalizedSearch) ||
        assignedUser.includes(normalizedSearch)
      );
    });
  }, [commands, search]);

  return (
    <DefaultLayout>
      <section className='commands-page'>
        <div className='commands-page__header'>
          <div>
            <h1 className='commands-page__title'>Suivi des commandes</h1>
            <p className='commands-page__subtitle'>
              Consultez les commandes synchronisées depuis l'API backend.
            </p>
          </div>
          <div className='commands-page__count'>
            {filteredCommands.length} commande
            {filteredCommands.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className='commands-page__toolbar'>
          <input
            type='text'
            className='commands-page__search'
            placeholder='Rechercher par référence, client ou opérateur...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className='commands-page__filters'>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type='button'
                className={`commands-page__filter ${statusFilter === filter.value ? 'commands-page__filter--active' : ''}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <Loading message='Chargement des commandes...' size='large' />
        )}

        {isError && (
          <div className='commands-page__feedback commands-page__feedback--error'>
            <p>
              {error instanceof Error
                ? error.message
                : 'Erreur lors du chargement des commandes.'}
            </p>
            <button type='button' onClick={() => refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredCommands.length === 0 && (
          <div className='commands-page__feedback'>
            Aucune commande trouvée avec ces filtres.
          </div>
        )}

        {!isLoading && !isError && filteredCommands.length > 0 && (
          <div className='commands-page__grid'>
            {filteredCommands.map((command) => (
              <CommandCard
                key={command.id}
                command={command}
                onViewDetails={(commandId) => navigate(`/commands/${commandId}`)}
              />
            ))}
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
