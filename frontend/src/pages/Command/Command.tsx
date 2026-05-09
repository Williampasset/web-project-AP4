import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import DefaultLayout from '@component/default/DefaultLayout';
import CommandCard from '@component/CommandCard/CommandCard';
import Loading from '@component/Loading/Loading';
import { useCommands, useUpdateCommand } from '../../hooks/commands.hooks';
import { useUsers } from '../../hooks/users.hooks';
import { useTrucks } from '../../hooks/trucks.hooks';
import type { CommandStatus } from '@type/command.type';
import './Command.css';

const STATUS_FILTERS: Array<{ value: 'ALL' | CommandStatus; label: string }> = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'WAITING', label: 'En attente' },
  { value: 'PENDING', label: 'En cours' },
  { value: 'READY', label: 'Prêtes' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export default function Command() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getInitialStatusFilter = (): 'ALL' | CommandStatus => {
    const status = searchParams.get('status');
    if (status === 'WAITING' || status === 'PENDING' || status === 'READY' || status === 'DELIVERED' || status === 'CANCELLED') {
      return status;
    }
    return 'ALL';
  };

  const [statusFilter, setStatusFilter] = useState<'ALL' | CommandStatus>(
    getInitialStatusFilter(),
  );
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [showLateOnly, setShowLateOnly] = useState(false);
  const [savingCommandId, setSavingCommandId] = useState<number | null>(null);

  const {
    data: commands = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useCommands(
    statusFilter === 'ALL' ? undefined : { status: statusFilter },
  );
  const { data: users = [] } = useUsers();
  const { data: trucks = [] } = useTrucks();
  const updateCommandMutation = useUpdateCommand();

  useEffect(() => {
    const status = searchParams.get('status');
    const searchFromParams = searchParams.get('search') ?? '';

    if (status === 'WAITING' || status === 'PENDING' || status === 'READY' || status === 'DELIVERED' || status === 'CANCELLED') {
      setStatusFilter(status);
    } else {
      setStatusFilter('ALL');
    }

    setSearch(searchFromParams);
  }, [searchParams]);

  /**
   * Filters and sorts the list of commands based on the current status filter,
   * search query, and late-only toggle.
   */
  const filteredCommands = useMemo(() => {
    const now = new Date();
    let filtered = commands;

    // Default filter: exclude only CANCELLED, show all others including DELIVERED
    if (statusFilter === 'ALL') {
      filtered = filtered.filter((cmd) => cmd.status !== 'CANCELLED');
    }

    // Filter by search
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter((command) => {
        const assignedUser =
          `${command.user.firstName} ${command.user.lastName}`.toLowerCase();
        return (
          command.reference.toLowerCase().includes(normalizedSearch) ||
          command.client.name.toLowerCase().includes(normalizedSearch) ||
          assignedUser.includes(normalizedSearch)
        );
      });
    }

    // Filter late commands
    if (showLateOnly) {
      filtered = filtered.filter((command) => {
        if (!command.deliveryDate) return false;
        const deliveryDate = new Date(command.deliveryDate);
        return deliveryDate < now && command.status !== 'DELIVERED';
      });
    }

    // Sort by delivery date (nearest or late first)
    const sorted = [...filtered].sort((a, b) => {
      if (statusFilter === 'ALL') {
        const aDelivered = a.status === 'DELIVERED';
        const bDelivered = b.status === 'DELIVERED';

        if (aDelivered !== bDelivered) {
          return aDelivered ? 1 : -1;
        }
      }

      const aDate = a.deliveryDate
        ? new Date(a.deliveryDate).getTime()
        : Infinity;
      const bDate = b.deliveryDate
        ? new Date(b.deliveryDate).getTime()
        : Infinity;
      return aDate - bDate;
    });

    return sorted;
  }, [commands, search, showLateOnly, statusFilter]);

  /**
   * Handles updating the assigned user and/or truck for a command.
   * Sets the savingCommandId state to show a loading indicator on the specific command card being updated.
   * Calls the updateCommand mutation with the command ID and the new user/truck assignments.
   * After the mutation completes, it resets the savingCommandId state to null.
   * @param commandId The ID of the command to update
   * @param data An object containing the new userId and/or truckId to assign to the command
   */
  const handleUpdateAssignments = async (
    commandId: number,
    data: { userId?: number; truckId?: number | null },
  ) => {
    setSavingCommandId(commandId);
    try {
      await updateCommandMutation.mutateAsync({
        id: commandId,
        data,
      });
    } finally {
      setSavingCommandId(null);
    }
  };

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

          <div className='commands-page__filters-bar'>
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
              <button
                type='button'
                className={`commands-page__filter commands-page__filter--late ${showLateOnly ? 'commands-page__filter--active' : ''}`}
                onClick={() => setShowLateOnly(!showLateOnly)}
                title='Afficher uniquement les commandes en retard'
              >
                En retard
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <Loading message='Chargement des commandes...' size='large' />
        )}

        {isError && (
          <div className='commands-page__feedback commands-page__feedback--error'>
            <h3>Erreur de chargement</h3>
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
                onViewDetails={(commandId) =>
                  navigate(`/commands/${commandId}`)
                }
                editableAssignments={command.status !== 'DELIVERED'}
                users={users}
                trucks={trucks}
                isUpdating={savingCommandId === command.id}
                onUpdateAssignments={handleUpdateAssignments}
              />
            ))}
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
