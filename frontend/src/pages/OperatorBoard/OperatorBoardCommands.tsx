import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { getStatusLabel } from '@service/mapper.service';
import { COMMAND_STATUSES } from '@type/command.type';
import StatCard from '@component/StatCard/StatCard';
import CommandCard from '@component/CommandCard/CommandCard';
import type { Command } from '@type/command.type';

interface FilterOptions {
  status: string;
  searchTerm: string;
  sortBy: 'date' | 'status' | 'reference';
  sortOrder: 'asc' | 'desc';
}

interface OperatorBoardCommandsProps {
  commands: Command[];
  error: Error | null;
}

export default function OperatorBoardCommands({
  commands,
  error,
}: OperatorBoardCommandsProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'ALL',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const activeCommands = useMemo(
    () =>
      commands.filter(
        (command) =>
          command.status !== 'DELIVERED' && command.status !== 'CANCELLED',
      ),
    [commands],
  );

  const operatorStatuses = useMemo(
    () => COMMAND_STATUSES.filter((status) => status !== 'DELIVERED' && status !== 'CANCELLED'),
    [],
  );

  /**
   * Filter and sort commands based on current filter state
   */
  const filteredAndSortedCommands = useMemo(() => {
    let filtered = activeCommands.filter((command) => {
      // Status filter
      if (filters.status !== 'ALL' && command.status !== filters.status) {
        return false;
      }

      // Search filter (by reference)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return command.reference.toLowerCase().includes(searchLower) ?? false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (filters.sortBy) {
        case 'date':
          compareValue =
            new Date(a.commandDate).getTime() -
            new Date(b.commandDate).getTime();
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        case 'reference':
          compareValue = a.reference.localeCompare(b.reference);
          break;
      }

      return filters.sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [activeCommands, filters]);

  /**
   * Get statistics for the dashboard
   */
  const statistics = useMemo(() => {
    return {
      total: activeCommands.length,
      waiting: activeCommands.filter((c) => c.status === 'WAITING').length,
      pending: activeCommands.filter((c) => c.status === 'PENDING').length,
    };
  }, [activeCommands]);

  /**
   * Handle command details navigation
   */
  const handleViewDetails = (commandId: number) => {
    navigate(`/commands/${commandId}`);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      searchTerm: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
    toast.success('Filtres réinitialisés');
  };

  if (error) {
    return (
      <div className='operator-board__commands-error'>
        <p className='operator-board__error-message'>
          Erreur lors du chargement des commandes:{' '}
          {error instanceof Error ? error.message : 'Une erreur inconnue'}
        </p>
        <button
          className='operator-board__error-button'
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className='operator-board__commands-section'>
      <div className='operator-board__stats'>
        <StatCard
          label='Total commandes'
          value={statistics.total}
          variant='default'
        />
        <StatCard
          label='En attente'
          value={statistics.waiting}
          variant='waiting'
        />
        <StatCard
          label='En cours'
          value={statistics.pending}
          variant='pending'
        />
      </div>

      <div className='operator-board__filters'>
        <div className='operator-board__filter-group'>
          <label
            htmlFor='status-filter'
            className='operator-board__filter-label'
          >
            Statut
          </label>
          <select
            id='status-filter'
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className='operator-board__filter-select'
          >
            <option value='ALL'>Tous les statuts</option>
            {operatorStatuses.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className='operator-board__filter-group'>
          <label
            htmlFor='search-filter'
            className='operator-board__filter-label'
          >
            Rechercher
          </label>
          <input
            id='search-filter'
            type='text'
            placeholder='Référence...'
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters({ ...filters, searchTerm: e.target.value })
            }
            className='operator-board__filter-input'
          />
        </div>

        <div className='operator-board__filter-group'>
          <label htmlFor='sort-filter' className='operator-board__filter-label'>
            Trier par
          </label>
          <select
            id='sort-filter'
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({
                ...filters,
                sortBy: e.target.value as 'date' | 'status' | 'reference',
              })
            }
            className='operator-board__filter-select'
          >
            <option value='date'>Date</option>
            <option value='status'>Statut</option>
            <option value='reference'>Référence</option>
          </select>
        </div>

        <div className='operator-board__filter-group'>
          <label
            htmlFor='order-filter'
            className='operator-board__filter-label'
          >
            Ordre
          </label>
          <select
            id='order-filter'
            value={filters.sortOrder}
            onChange={(e) =>
              setFilters({
                ...filters,
                sortOrder: e.target.value as 'asc' | 'desc',
              })
            }
            className='operator-board__filter-select'
          >
            <option value='desc'>Décroissant</option>
            <option value='asc'>Croissant</option>
          </select>
        </div>

        <button
          onClick={handleResetFilters}
          className='operator-board__filter-reset'
          title='Réinitialiser les filtres'
        >
          ✕ Réinitialiser
        </button>
      </div>

      {filteredAndSortedCommands.length === 0 ? (
        <div className='operator-board__empty'>
          <p className='operator-board__empty-text'>
            {activeCommands.length === 0
              ? 'Aucune commande assignée'
              : 'Aucune commande correspondant aux filtres'}
          </p>
        </div>
      ) : (
        <div className='operator-board__commands'>
          {filteredAndSortedCommands.map((command) => (
            <CommandCard
              key={command.id}
              command={command}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      <div className='operator-board__footer'>
        <p className='operator-board__results-count'>
          {filteredAndSortedCommands.length} commande
          {filteredAndSortedCommands.length !== 1 ? 's' : ''} affichée
          {filteredAndSortedCommands.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
