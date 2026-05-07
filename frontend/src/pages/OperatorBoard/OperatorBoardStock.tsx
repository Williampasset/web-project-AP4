import { useMemo, useState } from 'react';
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
import { validateStockJob } from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';

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

interface OperatorBoardStockProps {
  locations: WarehouseLocation[];
  userId: number | null;
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

export default function OperatorBoardStock({
  locations,
  userId,
}: OperatorBoardStockProps) {
  const queryClient = useQueryClient();
  const [stockTaskCodes, setStockTaskCodes] = useState<Record<number, string>>({});

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

  return (
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
  );
}
