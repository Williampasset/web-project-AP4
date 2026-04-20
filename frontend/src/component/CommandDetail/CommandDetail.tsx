import { getStatusClass, getStatusLabel } from '@service/mapper.service';
import { formatDate } from '@service/date.service';
import './CommandDetail.css';

interface Command {
  id: number;
  weight: number;
  status: 'WAITING' | 'PENDING' | 'FINISH';
  commandDate: string;
  deliveryDate: string | null;
  articleIds: number[];
  truckIds: number[];
  clientIds: number[];
  userId: number;
}

interface CommandDetailProps {
  command: Command;
  onBack: () => void;
}

/**
 * Composant CommandDetail - Affiche les détails d'une commande
 *
 * @param command - La commande à afficher
 * @param onBack - Fonction appelée pour revenir à la liste
 */
export default function CommandDetail({ command, onBack }: CommandDetailProps) {
  return (
    <div className='operateur-board'>
      <div className='command-detail'>
        <button className='back-button' onClick={onBack}>
          ← Retour à la liste
        </button>

        <div className='detail-header'>
          <h2>Commande #{command.id}</h2>
          <span className={`status-badge ${getStatusClass(command.status)}`}>
            {getStatusLabel(command.status)}
          </span>
        </div>

        <div className='detail-content'>
          <div className='detail-row'>
            <span className='label'>Poids:</span>
            <span className='value'>{command.weight} kg</span>
          </div>

          <div className='detail-row'>
            <span className='label'>Date de commande:</span>
            <span className='value'>{formatDate(command.commandDate)}</span>
          </div>

          {command.deliveryDate && (
            <div className='detail-row'>
              <span className='label'>Date de livraison:</span>
              <span className='value'>{formatDate(command.deliveryDate)}</span>
            </div>
          )}

          <div className='detail-row'>
            <span className='label'>Articles:</span>
            <span className='value'>{command.articleIds.join(', ')}</span>
          </div>

          <div className='detail-row'>
            <span className='label'>Camions:</span>
            <span className='value'>{command.truckIds.join(', ')}</span>
          </div>

          <div className='detail-row'>
            <span className='label'>Clients:</span>
            <span className='value'>{command.clientIds.join(', ')}</span>
          </div>

          <div className='detail-row'>
            <span className='label'>Utilisateur:</span>
            <span className='value'>#{command.userId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
