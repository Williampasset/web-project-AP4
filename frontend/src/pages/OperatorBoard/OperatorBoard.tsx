import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import './OperatorBoard.css';
import Loading from '../../component/Loading/Loading';
import { useCommands } from '../../hooks/commands.hooks';
import { fetchLocations } from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import OperatorBoardSelector from './OperatorBoardSelector';
import OperatorBoardCommands from './OperatorBoardCommands';
import OperatorBoardStock from './OperatorBoardStock';

type OperatorBoardMode = 'commands' | 'stock';

export default function OperatorBoard() {
  const user = localStorage.getItem('user');
  const userId = user ? Number(JSON.parse(user)?.sub) : null;
  const [selectedMode, setSelectedMode] = useState<OperatorBoardMode>('commands');

  const {
    data: commands = [],
    isLoading,
    error,
  } = useCommands({
    userId: userId ?? undefined,
  });

  const { data: locations = [] } = useQuery<WarehouseLocation[]>({
    queryKey: ['locations', 'operator-board'],
    queryFn: fetchLocations,
    enabled: userId !== null,
    refetchInterval: 15000,
  });

  const activeCommands = useMemo(
    () =>
      commands.filter(
        (command) =>
          command.status !== 'DELIVERED' && command.status !== 'CANCELLED',
      ),
    [commands],
  );

  // Count pending stock tasks
  const assignedStockTasksCount = useMemo(() => {
    if (!userId) return 0;
    let count = 0;
    for (const location of locations) {
      for (const job of location.pendingJobs ?? []) {
        if (job.assignedUser.id === userId && job.status === 'PENDING') {
          count++;
        }
      }
    }
    return count;
  }, [locations, userId]);

  if (isLoading) {
    return <Loading message='Chargement du tableau de bord...' />;
  }

  if (error) {
    return (
      <div className='operator-board operator-board--error'>
        <p className='operator-board__error-message'>
          Erreur lors du chargement:{' '}
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
          Sélectionnez une opération pour commencer
        </p>
      </div>

      <OperatorBoardSelector
        onSelect={setSelectedMode}
        commandsCount={activeCommands.length}
        stockTasksCount={assignedStockTasksCount}
        selectedMode={selectedMode}
      />

      {selectedMode === 'commands' && (
        <OperatorBoardCommands
          commands={commands}
          error={error}
        />
      )}

      {selectedMode === 'stock' && (
        <OperatorBoardStock
          locations={locations}
          userId={userId}
        />
      )}
    </div>
  );
}
