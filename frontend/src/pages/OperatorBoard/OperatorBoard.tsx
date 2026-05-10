import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import './OperatorBoard.css';
import Loading from '../../component/Loading/Loading';
import { getStatusLabel } from '@service/mapper.service';
import { useCommands } from '../../hooks/commands.hooks';
import { COMMAND_STATUSES } from '@type/command.type';
import StatCard from '@component/StatCard/StatCard';
import CommandCard from '@component/CommandCard/CommandCard';
import { fetchLocations } from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';

interface FilterOptions {
  status: string;
  searchTerm: string;
  sortBy: 'date' | 'status' | 'reference';
  sortOrder: 'asc' | 'desc';
}

type OperatorView = 'commands' | 'stock-jobs';

type AssignedStockTask = {
  id: number;
  type: 'MOVE' | 'MERGE';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  quantity: number;
  requestedAt: string;
  sourceLocationCode: string;
  sourceArticleReference: string;
  sourceArticleLabel: string;
};

export default function OperatorBoard() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const userId = user ? Number(JSON.parse(user)?.sub) : null;
  const [activeView, setActiveView] = useState<OperatorView>('commands');

  const {
    data: commands = [],
    isLoading,
    error,
  } = useCommands({
    userId: userId ?? undefined,
  });

  const {
    data: locations = [],
    isLoading: isLoadingStockTasks,
  } = useQuery<WarehouseLocation[]>({
    queryKey: ['locations', 'operator-stock-tasks'],
    queryFn: fetchLocations,
    enabled: userId != null,
    refetchInterval: 10000,
  });

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'ALL',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  /**
   * Filter and sort commands based on current filter state
   */
  const filteredAndSortedCommands = useMemo(() => {
    let filtered = commands.filter((command) => {
      if (command.status !== 'WAITING' && command.status !== 'PENDING') {
        return false;
      }

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
  }, [commands, filters]);

  const assignedStockTasks = useMemo<AssignedStockTask[]>(() => {
    if (userId == null) return [];

    return locations
      .flatMap((location) => {
        const sourceLocationCode = `${location.building}${location.aisle}S${location.shelf}C${location.cell}`;

        return (location.pendingJobs ?? [])
          .filter((job) => job.assignedUser.id === userId)
          .map((job) => {
            const sourceArticle =
              location.articles.find((article) => article.id === job.sourceArticleId) ??
              null;

            return {
              id: job.id,
              type: job.type,
              status: job.status,
              quantity: job.quantity,
              requestedAt: job.requestedAt,
              sourceLocationCode,
              sourceArticleReference: sourceArticle?.reference ?? `Article #${job.sourceArticleId}`,
              sourceArticleLabel: sourceArticle?.label ?? 'Article',
            };
          });
      })
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      );
  }, [locations, userId]);

  /**
   * Get statistics for the dashboard
   */
  const statistics = useMemo(() => {
    return {
      total: commands.filter(
        (c) => c.status === 'WAITING' || c.status === 'PENDING',
      ).length,
      waiting: commands.filter((c) => c.status === 'WAITING').length,
      pending: commands.filter((c) => c.status === 'PENDING').length,
    };
  }, [commands]);

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

  const handleOpenStockTaskDetail = (jobId: number) => {
    navigate(`/stock-jobs/${jobId}`);
  };

  if (isLoading) {
    return <Loading message='Chargement des commandes...' />;
  }

  if (activeView === 'stock-jobs' && isLoadingStockTasks) {
    return <Loading message='Chargement des tâches de stock...' />;
  }

  if (error) {
    return (
      <div className='operator-board operator-board--error'>
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
    <div className='operator-board'>
      <div className='operator-board__header'>
        <h1 className='operator-board__title'>Tableau de bord opérateur</h1>
        <p className='operator-board__subtitle'>
          Gérez vos affectations : commandes et tâches de stock
        </p>
      </div>

      <div className='operator-board__view-selector'>
        <p className='operator-board__filter-label'>
          Éléments affectés
        </p>
        <div className='operator-board__view-buttons'>
          <button
            type='button'
            className={`operator-board__view-button ${activeView === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveView('commands')}
            aria-pressed={activeView === 'commands'}
          >
            Commandes affectées
          </button>
          <button
            type='button'
            className={`operator-board__view-button ${activeView === 'stock-jobs' ? 'active' : ''}`}
            onClick={() => setActiveView('stock-jobs')}
            aria-pressed={activeView === 'stock-jobs'}
          >
            Tâches de stock affectées
          </button>
        </div>
      </div>

      {activeView === 'commands' ? (
        <>
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
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
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
              <label
                htmlFor='sort-filter'
                className='operator-board__filter-label'
              >
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
                  onViewDetails={handleViewDetails}
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
      ) : (
        <>
          <div className='operator-board__stats'>
            <StatCard
              label='Total tâches stock'
              value={assignedStockTasks.length}
              variant='default'
            />
            <StatCard
              label='En attente'
              value={assignedStockTasks.filter((task) => task.status === 'PENDING').length}
              variant='pending'
            />
          </div>

          {assignedStockTasks.length === 0 ? (
            <div className='operator-board__empty'>
              <p className='operator-board__empty-text'>
                Aucune tâche de stock affectée
              </p>
            </div>
          ) : (
            <div className='operator-board__stock-tasks'>
              {assignedStockTasks.map((task) => (
                <article key={task.id} className='operator-board__stock-task-card'>
                  <div className='operator-board__stock-task-head'>
                    <span className='operator-board__stock-task-id'>#{task.id}</span>
                    <span className='operator-board__stock-task-type'>{task.type}</span>
                  </div>
                  <button
                    type='button'
                    className='operator-board__stock-task-validate'
                    onClick={() => handleOpenStockTaskDetail(task.id)}
                    title='Voir le détail de la tâche'
                  >
                    <span className='operator-board__stock-task-article'>
                      {task.sourceArticleReference} — {task.sourceArticleLabel}
                    </span>
                    <span className='operator-board__stock-task-action'>
                      Ouvrir le détail de validation
                    </span>
                  </button>
                  <p className='operator-board__stock-task-meta'>
                    Cellule source : {task.sourceLocationCode} · Qté : {task.quantity}
                  </p>
                </article>
              ))}
            </div>
          )}

          <div className='operator-board__footer'>
            <p className='operator-board__results-count'>
              {assignedStockTasks.length} tâche
              {assignedStockTasks.length !== 1 ? 's' : ''} affichée
              {assignedStockTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
