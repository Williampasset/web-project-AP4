import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, QrCode } from 'lucide-react';
import Loading from '@component/Loading/Loading';
import {
  fetchLocations,
  validateStockJob,
} from '@service/api/locations.service';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import QrLocationScanner from '@component/QrLocationScanner/QrLocationScanner';
import './StockJobDetail.css';

type ScanStep = 'source' | 'target';

const formatLocationCode = (location: {
  building: string;
  aisle: number;
  shelf: number;
  cell: number;
}) => `${location.building}${location.aisle}S${location.shelf}C${location.cell}`;

export default function StockJobDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const jobId = id ? Number(id) : null;
  const user = localStorage.getItem('user');
  const userId = user ? Number(JSON.parse(user)?.sub) : null;

  const [showScanner, setShowScanner] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>('source');

  const { data: locations = [], isLoading, isError } = useQuery<WarehouseLocation[]>({
    queryKey: ['locations', 'stock-job-detail', jobId],
    queryFn: fetchLocations,
    enabled: jobId != null,
    refetchInterval: 10000,
  });

  const validateMutation = useMutation({
    mutationFn: ({ targetJobId, validatedByUserId }: { targetJobId: number; validatedByUserId: number }) =>
      validateStockJob(targetJobId, validatedByUserId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['locations', 'stock-job-detail', jobId] }),
        queryClient.invalidateQueries({ queryKey: ['locations', 'operator-stock-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['locations', 'warehouse-view'] }),
      ]);
    },
  });

  const stockJob = useMemo(() => {
    if (jobId == null) return null;

    const locationsById = new Map(locations.map((loc) => [loc.id, loc]));
    const articleLocationByArticleId = new Map<number, WarehouseLocation>();

    for (const location of locations) {
      for (const article of location.articles) {
        articleLocationByArticleId.set(article.id, location);
      }
    }

    for (const sourceLocation of locations) {
      for (const job of sourceLocation.pendingJobs ?? []) {
        if (job.id !== jobId) continue;

        const sourceArticle = sourceLocation.articles.find(
          (article) => article.id === job.sourceArticleId,
        );

        const targetLocation = job.targetLocationId
          ? locationsById.get(job.targetLocationId) ?? null
          : job.targetArticleId
            ? articleLocationByArticleId.get(job.targetArticleId) ?? null
            : null;

        return {
          job,
          sourceLocation,
          targetLocation,
          sourceArticle,
        };
      }
    }

    return null;
  }, [locations, jobId]);

  const sourceCode = stockJob
    ? formatLocationCode(stockJob.sourceLocation)
    : '';

  const targetCode = stockJob?.targetLocation
    ? formatLocationCode(stockJob.targetLocation)
    : null;

  const isTargetOccupied =
    stockJob?.job.type === 'MOVE' &&
    !!stockJob.targetLocation &&
    stockJob.targetLocation.articles.length > 0;

  const occupiedTargetLabel = isTargetOccupied
    ? stockJob?.targetLocation?.articles[0]?.label ?? null
    : null;

  const canValidate =
    stockJob != null &&
    userId != null &&
    stockJob.job.assignedUser.id === userId &&
    stockJob.job.status === 'PENDING' &&
    !isTargetOccupied;

  const doValidate = async () => {
    if (!stockJob || !userId) return;

    try {
      await validateMutation.mutateAsync({
        targetJobId: stockJob.job.id,
        validatedByUserId: userId,
      });
      toast.success('Déplacement validé');
      navigate('/operateur');
    } catch (e) {
      const message = (e as Error)?.message ?? 'Échec de validation';

      if (message.toLowerCase().includes('already occupied')) {
        toast.error(
          'Destination déjà occupée. Cette tâche ne peut plus être validée.',
        );
      } else {
        toast.error(message);
      }

      await queryClient.invalidateQueries({
        queryKey: ['locations', 'stock-job-detail', jobId],
      });
    }
  };

  const openQrValidation = () => {
    if (!canValidate) return;
    setScanStep('source');
    setShowScanner(true);
  };

  const handleQrStepSuccess = async () => {
    if (scanStep === 'source' && targetCode) {
      setScanStep('target');
      return;
    }

    setShowScanner(false);
    await doValidate();
  };

  if (isLoading) {
    return <Loading message='Chargement de la tâche stock...' />;
  }

  if (isError || !stockJob) {
    return (
      <div className='stock-job-detail stock-job-detail--error'>
        <h2>Tâche introuvable</h2>
        <p>Cette tâche n&apos;est plus disponible (déjà validée ou inexistante).</p>
        <button type='button' onClick={() => navigate('/operateur')}>
          Retour opérateur
        </button>
      </div>
    );
  }

  return (
    <div className='stock-job-detail'>
      <div className='stock-job-detail__header'>
        <button
          type='button'
          className='stock-job-detail__back'
          onClick={() => navigate('/operateur')}
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <h1>Tâche stock #{stockJob.job.id}</h1>
      </div>

      <div className='stock-job-detail__card'>
        <p>
          <strong>Type:</strong> {stockJob.job.type}
        </p>
        <p>
          <strong>Article:</strong> {stockJob.sourceArticle?.reference ?? `Article #${stockJob.job.sourceArticleId}`} —{' '}
          {stockJob.sourceArticle?.label ?? 'Article'}
        </p>
        <p>
          <strong>Quantité:</strong> {stockJob.job.quantity}
        </p>
        <p>
          <strong>Cellule source:</strong> {sourceCode}
        </p>
        <p>
          <strong>Cellule destination:</strong> {targetCode ?? 'N/A'}
        </p>
      </div>

      {!canValidate && (
        <p className='stock-job-detail__warning'>
          Cette tâche n&apos;est pas validable avec cet utilisateur.
        </p>
      )}

      {isTargetOccupied && (
        <p className='stock-job-detail__warning'>
          Destination déjà occupée{occupiedTargetLabel ? ` par « ${occupiedTargetLabel} »` : ''}. Replanifiez la tâche depuis l&apos;écran d&apos;affectation.
        </p>
      )}

      <div className='stock-job-detail__actions'>
        <button
          type='button'
          className='stock-job-detail__btn stock-job-detail__btn--manual'
          onClick={() => void doValidate()}
          disabled={!canValidate || validateMutation.isPending}
        >
          <CheckCircle2 size={18} />
          Valider manuellement
        </button>

        <button
          type='button'
          className='stock-job-detail__btn stock-job-detail__btn--qr'
          onClick={openQrValidation}
          disabled={!canValidate || validateMutation.isPending}
        >
          <QrCode size={18} />
          Scanner source puis destination
        </button>
      </div>

      {showScanner && (
        <QrLocationScanner
          expectedCode={scanStep === 'source' ? sourceCode : targetCode ?? sourceCode}
          title={scanStep === 'source' ? 'Scanner cellule source' : 'Scanner cellule destination'}
          hint={scanStep === 'source' ? 'Code attendu source:' : 'Code attendu destination:'}
          onSuccess={() => void handleQrStepSuccess()}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
