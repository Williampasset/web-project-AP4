import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowRightLeft,
  GitMerge,
  MapPin,
  Clock3,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import './OperatorBoard.css';
import Loading from '../../component/Loading/Loading';
import { getStatusLabel } from '@service/mapper.service';
import { useCommands } from '../../hooks/commands.hooks';
import { COMMAND_STATUSES } from '@type/command.type';
import StatCard from '@component/StatCard/StatCard';
import CommandCard from '@component/CommandCard/CommandCard';
import { fetchLocations, validateStockJob } from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';

interface FilterOptions {
  status: string;
  searchTerm: string;
  sortBy: 'date' | 'status' | 'reference';
  sortOrder: 'asc' | 'desc';
}

interface AssignedStockTask {
  id: number;
  type: 'MOVE' | 'MERGE';
  quantity: number;
  requestedAt: string;
  sourceLocationLabel: string;
  targetLocationLabel: string;
  expectedCellCode: string;
  articleReference: string;
  articleLabel: string;
}

const normalizeCellCode = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.code === 'string') {
      return normalizeCellCode(parsed.code);
    }
  } catch {
    // ignore non-json input
  }

  return trimmed
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[-_/]/g, '');
};

export default function OperatorBoard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = localStorage.getItem('user');
  const userId = user ? Number(JSON.parse(user)?.sub) : null;
  const [stockTaskCodes, setStockTaskCodes] = useState<Record<number, string>>({});

  const {
    data: commands = [],
    isLoading,
    error,
  } = useCommands({
    userId,
  });

  const { data: locations = [] } = useQuery<WarehouseLocation[]>({
    queryKey: ['locations', 'operator-board'],
    queryFn: fetchLocations,
    enabled: userId !== null,
    refetchInterval: 15000,
  });

  const validateStockJobMutation = useMutation({
    mutationFn: (jobId: number) => validateStockJob(jobId, userId ?? 0),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['locations', 'operator-board'] }),
        queryClient.invalidateQueries({ queryKey: ['locations', 'warehouse-view'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-jobs-assignment'] }),
      ]);
    },
  });

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

  const assignedStockTasks = useMemo<AssignedStockTask[]>(() => {
    if (!userId) return [];

    const locationById = new Map(
      locations.map((loc) => [
        loc.id,
        {
          label: `${loc.building}-${loc.aisle}-${loc.shelf}-${loc.cell}`,
          code: `${loc.building}${loc.aisle}S${loc.shelf}C${loc.cell}`,
        },
      ]),
    );

    const articleLocationById = new Map<number, { label: string; code: string }>();
    for (const location of locations) {
      const info = locationById.get(location.id);
      if (!info) continue;
      for (const article of location.articles) {
        articleLocationById.set(article.id, info);
      }
    }

    const tasks: AssignedStockTask[] = [];

    for (const location of locations) {
      const sourceLocationLabel = `${location.building}-${location.aisle}-${location.shelf}-${location.cell}`;
      for (const job of location.pendingJobs ?? []) {
        if (job.assignedUser.id !== userId || job.status !== 'PENDING') continue;

        const sourceArticle = location.articles.find(
          (article) => article.id === job.sourceArticleId,
        );

        tasks.push({
          id: job.id,
          type: job.type,
          quantity: job.quantity,
          requestedAt: job.requestedAt,
          sourceLocationLabel,
          targetLocationLabel:
            job.type === 'MOVE'
              ? (job.targetLocationId
                  ? (locationById.get(job.targetLocationId)?.label ?? `#${job.targetLocationId}`)
                  : '—')
              : (job.targetArticleId
                  ? (articleLocationById.get(job.targetArticleId)?.label ?? 'Cellule cible')
                  : 'Cellule cible'),
          expectedCellCode:
            job.type === 'MOVE'
              ? (job.targetLocationId
                  ? (locationById.get(job.targetLocationId)?.code ?? '')
                  : '')
              : (job.targetArticleId
                  ? (articleLocationById.get(job.targetArticleId)?.code ?? '')
                  : ''),
          articleReference: sourceArticle?.reference ?? `#${job.sourceArticleId}`,
          articleLabel: sourceArticle?.label ?? 'Article',
        });
      }
    }

    return tasks.sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
  }, [locations, userId]);

  const handleManualCodeChange = (jobId: number, value: string) => {
    setStockTaskCodes((prev) => ({
      ...prev,
      [jobId]: value,
    }));
  };

  const handleScanPrompt = (jobId: number) => {
    const scannedValue = window.prompt('Scannez le QR code de la cellule (ou collez la valeur)');
    if (!scannedValue) return;
    handleManualCodeChange(jobId, scannedValue);
  };

  const handleValidateTask = async (task: AssignedStockTask) => {
    const enteredCode = normalizeCellCode(stockTaskCodes[task.id] ?? '');
    const expectedCode = normalizeCellCode(task.expectedCellCode);

    if (!enteredCode) {
      toast.error('Scannez le QR ou saisissez le code cellule avant validation');
      return;
    }

    if (!expectedCode || enteredCode !== expectedCode) {
      toast.error(`Code cellule invalide. Attendu: ${task.expectedCellCode || task.targetLocationLabel}`);
      return;
    }

    try {
      await validateStockJobMutation.mutateAsync(task.id);
      toast.success('Tâche validée avec succès');
      setStockTaskCodes((prev) => ({ ...prev, [task.id]: '' }));
    } catch (error) {
      toast.error((error as Error)?.message || 'Échec de validation de la tâche');
    }
  };

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

  if (isLoading) {
    return <Loading message='Chargement des commandes...' />;
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
          Gérez vos commandes et suivez leur progression
        </p>
      </div>

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

      <div className='operator-board__stock-section'>
        <h2 className='operator-board__section-title'>Tâches de stock en cours</h2>
        {assignedStockTasks.length === 0 ? (
          <div className='operator-board__section-empty'>Aucune tâche de stock assignée</div>
        ) : (
          <div className='operator-board__stock-list'>
            {assignedStockTasks.map((task) => (
              <div key={task.id} className='operator-board__stock-card'>
                <div className='operator-board__stock-head'>
                  <span className='operator-board__stock-type'>
                    {task.type === 'MOVE' ? <ArrowRightLeft size={14} /> : <GitMerge size={14} />}
                    {task.type === 'MOVE' ? 'Déplacement' : 'Fusion'}
                  </span>
                  <span className='operator-board__stock-qty'>Qté: {task.quantity}</span>
                </div>
                <div className='operator-board__stock-article'>
                  {task.articleReference} — {task.articleLabel}
                </div>
                <div className='operator-board__stock-meta'>
                  <span>
                    <MapPin size={13} />
                    {task.sourceLocationLabel} → {task.targetLocationLabel}
                  </span>
                  <span>
                    <Clock3 size={13} />
                    {new Date(task.requestedAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className='operator-board__stock-validation'>
                  <div className='operator-board__stock-code-hint'>
                    Cellule attendue: <strong>{task.expectedCellCode || task.targetLocationLabel}</strong>
                  </div>
                  <div className='operator-board__stock-code-row'>
                    <input
                      className='operator-board__stock-code-input'
                      value={stockTaskCodes[task.id] ?? ''}
                      onChange={(e) => handleManualCodeChange(task.id, e.target.value)}
                      placeholder='Scannez ou saisissez le code (ex: A1S1C2)'
                    />
                    <button
                      type='button'
                      className='operator-board__stock-btn operator-board__stock-btn--scan'
                      onClick={() => handleScanPrompt(task.id)}
                    >
                      <QrCode size={14} />
                      Scanner QR
                    </button>
                    <button
                      type='button'
                      className='operator-board__stock-btn operator-board__stock-btn--validate'
                      onClick={() => handleValidateTask(task)}
                      disabled={validateStockJobMutation.isPending}
                    >
                      <CheckCircle2 size={14} />
                      Valider
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
