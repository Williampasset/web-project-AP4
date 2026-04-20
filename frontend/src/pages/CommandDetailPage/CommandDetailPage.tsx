import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Loading from '../../component/Loading/Loading';
import CommandDetail from '../../component/CommandDetail/CommandDetail';
import data from '@data/commands.json';

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

/**
 * Page de détails d'une commande
 * Permet à l'opérateur de voir les détails et commencer la préparation
 */
export default function CommandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [command, setCommand] = useState<Command | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommand();
  }, [id]);

  /**
   * Charge la commande depuis les données
   */
  const loadCommand = async () => {
    try {
      setLoading(true);

      if (!id) {
        navigate('/operateur');
        return;
      }

      const commandId = parseInt(id);
      const foundCommand = (data.commands as Command[]).find(
        (cmd: Command) => cmd.id === commandId,
      );

      if (!foundCommand) {
        navigate('/operateur');
        return;
      }

      setCommand(foundCommand);
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
      navigate('/operateur');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Commence la préparation de la commande
   */
  const startPreparation = () => {
    if (command) {
      navigate(`/preparation/${command.id}`);
    }
  };

  /**
   * Retourne à la liste des commandes
   */
  const goBack = () => {
    navigate('/operateur');
  };

  if (loading) {
    return <Loading message='Chargement de la commande...' />;
  }

  if (!command) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Commande introuvable</h2>
        <button onClick={goBack} style={{ marginTop: '1rem' }}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div>
      <CommandDetail command={command} onBack={goBack} />

      {/* Bouton pour commencer la préparation */}
      {command.status === 'WAITING' && (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            background: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
          }}
        >
          <button
            onClick={startPreparation}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#218838')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#28a745')}
          >
            🚀 Commencer la préparation
          </button>
        </div>
      )}
    </div>
  );
}
