import { getStatusLabel } from '@service/mapper.service';
import { COMMAND_STATUSES, type Command } from '@type/command.type';
import StatCard from '@component/StatCard/StatCard';
import CommandCard from '@component/CommandCard/CommandCard';
import type { FilterOptions } from '../operatorBoard.utils';

type Props = {
  filters: FilterOptions;
  onFiltersChange: (next: FilterOptions) => void;
  onResetFilters: () => void;
  statistics: {
    total: number;
    waiting: number;
    pending: number;
  };
  filteredAndSortedCommands: Command[];
  onViewDetails: (commandId: number) => void;
};

export default function OperatorBoardCommandsView({
  filters,
  onFiltersChange,
  onResetFilters,
  statistics,
  filteredAndSortedCommands,
  onViewDetails,
}: Props) {
  return (
    <>
      <div className='operator-board__stats'>
        <StatCard
          label='Total commandes'
          value={statistics.total}
          variant='default'
        />
        <StatCard label='En attente' value={statistics.waiting} variant='waiting' />
        <StatCard label='En cours' value={statistics.pending} variant='pending' />
      </div>

      <div className='operator-board__filters'>
        <div className='operator-board__filter-group'>
          <label htmlFor='status-filter' className='operator-board__filter-label'>
            Statut
          </label>
          <select
            id='status-filter'
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value })
            }
            className='operator-board__filter-select'
          >
            <option value='ALL'>Tous les statuts</option>
            {COMMAND_STATUSES.filter(
              (status) => status === 'WAITING' || status === 'PENDING',
            ).map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className='operator-board__filter-group'>
          <label htmlFor='search-filter' className='operator-board__filter-label'>
            Rechercher
          </label>
          <input
            id='search-filter'
            type='text'
            placeholder='Référence...'
            value={filters.searchTerm}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchTerm: e.target.value })
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
              onFiltersChange({
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
          <label htmlFor='order-filter' className='operator-board__filter-label'>
            Ordre
          </label>
          <select
            id='order-filter'
            value={filters.sortOrder}
            onChange={(e) =>
              onFiltersChange({
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
          onClick={onResetFilters}
          className='operator-board__filter-reset'
          title='Réinitialiser les filtres'
        >
          ✕ Réinitialiser
        </button>
      </div>

      {filteredAndSortedCommands.length === 0 ? (
        <div className='operator-board__empty'>
          <p className='operator-board__empty-text'>
            {statistics.total === 0
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
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      <div className='operator-board__footer'>
        <p className='operator-board__results-count'>
          {filteredAndSortedCommands.length} commande
          {filteredAndSortedCommands.length !== 1 ? 's' : ''} affichée
          {filteredAndSortedCommands.length !== 1 ? 's' : ''}
        </p>
      </div>
    </>
  );
}
