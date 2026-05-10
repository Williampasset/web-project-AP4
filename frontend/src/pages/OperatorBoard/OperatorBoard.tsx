import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import './OperatorBoard.css';
import Loading from '../../component/Loading/Loading';
import { useCommands } from '../../hooks/commands.hooks';
import { fetchLocations } from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import {
  DEFAULT_FILTERS,
  getAssignedStockTasks,
  getCommandStatistics,
  getFilteredAndSortedCommands,
  getOperatorUserId,
  type FilterOptions,
} from './operatorBoard.utils';
import OperatorBoardCommandsView from './components/OperatorBoardCommandsView';
import OperatorBoardStockTasksView from './components/OperatorBoardStockTasksView';

type OperatorView = 'commands' | 'stock-jobs';

export default function OperatorBoard() {
  const navigate = useNavigate();
  const userId = getOperatorUserId();
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

  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const filteredAndSortedCommands = useMemo(
    () => getFilteredAndSortedCommands(commands, filters),
    [commands, filters],
  );

  const assignedStockTasks = useMemo(
    () => getAssignedStockTasks(locations, userId),
    [locations, userId],
  );

  const statistics = useMemo(() => getCommandStatistics(commands), [commands]);

  const handleViewDetails = (commandId: number) => {
    navigate(`/commands/${commandId}`);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
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
        <p className='operator-board__filter-label'>Éléments affectés</p>
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
        <OperatorBoardCommandsView
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={handleResetFilters}
          statistics={statistics}
          filteredAndSortedCommands={filteredAndSortedCommands}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <OperatorBoardStockTasksView
          assignedStockTasks={assignedStockTasks}
          onOpenStockTaskDetail={handleOpenStockTaskDetail}
        />
      )}
    </div>
  );
}
