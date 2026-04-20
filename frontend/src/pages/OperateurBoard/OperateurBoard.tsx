import { useState, useEffect } from 'react';
import './OperateurBoard.css';
import data from '@data/commands.json';
import Loading from '../../component/Loading/Loading';
import CommandDetail from '../../component/CommandDetail/CommandDetail';
import { getStatusClass, getStatusLabel } from '@service/mapper.service';
import { formatDate } from '@service/date.service';

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

export default function OperateurBoard() {
  const [commands, setCommands] = useState<Command[]>(
    data?.commands as Command[],
  );
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommands();
  }, []);

  /**
   * Charge les commandes depuis l'API ou le fichier JSON
   */
  const loadCommands = async () => {
    try {
      setLoading(true);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setCommands([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtre les commandes selon le statut sélectionné
   */
  const filteredCommands = commands.filter((command) => {
    if (filterStatus === 'ALL') return true;
    return command.status === filterStatus;
  });

  if (loading) {
    return <Loading message='Chargement des commandes...' />;
  }

  if (selectedCommand) {
    return (
      <CommandDetail
        command={selectedCommand}
        onBack={() => setSelectedCommand(null)}
      />
    );
  }

  return (
    <div className='operateur-board'>
      <div className='board-header'>
        <h1>Mes Commandes</h1>

        {/* Filtre par statut */}
        <div className='filter-container'>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='status-filter'
          >
            <option value='ALL'>Tous les statuts</option>
            <option value='WAITING'>En attente</option>
            <option value='PENDING'>En cours</option>
            <option value='FINISH'>Terminées</option>
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className='commands-list'>
        {filteredCommands.length === 0 ? (
          <div className='no-commands'>Aucune commande trouvée</div>
        ) : (
          filteredCommands.map((command) => (
            <div
              key={command.id}
              className='command-card'
              onClick={() => setSelectedCommand(command)}
            >
              <div className='card-header'>
                <span className='command-id'>#{command.id}</span>
                <span
                  className={`status-badge ${getStatusClass(command.status)}`}
                >
                  {getStatusLabel(command.status)}
                </span>
              </div>

              <div className='card-content'>
                <div className='card-row'>
                  <span className='label'>Poids:</span>
                  <span className='value'>{command.weight} kg</span>
                </div>

                <div className='card-row'>
                  <span className='label'>Date:</span>
                  <span className='value'>
                    {formatDate(command.commandDate)}
                  </span>
                </div>

                <div className='card-row'>
                  <span className='label'>Articles:</span>
                  <span className='value'>
                    {command.articleIds.length} article(s)
                  </span>
                </div>
              </div>

              <div className='card-footer'>
                <span className='view-detail'>Voir détails →</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
