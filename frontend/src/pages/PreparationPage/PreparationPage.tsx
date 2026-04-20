import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Loading from '../../component/Loading/Loading';
import data from '@data/commands.json';
import stockData from '@data/stock.json';
import './PreparationPage.css';

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

interface Article {
  id: number;
  weight: number;
  label: string;
  description: string | null;
  stock: number;
  locationId: number;
  command: number[];
}

/**
 * Page de préparation d'une commande
 * Permet à l'opérateur de préparer les articles nécessaires
 */
export default function PreparationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [command, setCommand] = useState<Command | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparedItems, setPreparedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCommandAndArticles();
  }, [id]);

  /**
   * Charge la commande et les articles associés
   */
  const loadCommandAndArticles = async () => {
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

      // Charger les articles de la commande
      const commandArticles = stockData.stocks.filter((article: Article) =>
        foundCommand.articleIds.includes(article.id),
      );
      setArticles(commandArticles);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      navigate('/operateur');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marque un article comme préparé
   */
  const togglePrepared = (articleId: number) => {
    setPreparedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  /**
   * Finalise la préparation de la commande
   */
  const finishPreparation = () => {
    // Ici on pourrait faire un appel API pour mettre à jour le statut
    alert("Préparation terminée ! La commande est prête pour l'expédition.");
    navigate('/operateur');
  };

  /**
   * Annule la préparation et retourne aux détails
   */
  const cancelPreparation = () => {
    navigate(`/commande/${id}`);
  };

  if (loading) {
    return <Loading message='Chargement de la préparation...' />;
  }

  if (!command) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Commande introuvable</h2>
        <button
          onClick={() => navigate('/operateur')}
          style={{ marginTop: '1rem' }}
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const allPrepared =
    articles.length > 0 && preparedItems.size === articles.length;

  return (
    <div className='preparation-container'>
      <div className='preparation-header'>
        <h1>Préparation - Commande #{command.id}</h1>

        <div className='progress-info'>
          <p>
            <strong>Poids total:</strong> {command.weight} kg
          </p>
          <p>
            <strong>Articles à préparer:</strong> {articles.length}
          </p>
          <p>
            <strong>Préparés:</strong> {preparedItems.size}/{articles.length}
          </p>
        </div>

        {/* Barre de progression */}
        <div className='progress-bar'>
          <div
            className='progress-fill'
            style={{
              width: `${articles.length > 0 ? (preparedItems.size / articles.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Liste des articles à préparer */}
      <div className='articles-section'>
        <h2>Articles à préparer</h2>

        {articles.length === 0 ? (
          <p className='no-articles'>
            Aucun article à préparer pour cette commande.
          </p>
        ) : (
          <div>
            {articles.map((article) => (
              <div
                key={article.id}
                className={`article-item ${preparedItems.has(article.id) ? 'prepared' : ''}`}
              >
                <input
                  type='checkbox'
                  checked={preparedItems.has(article.id)}
                  onChange={() => togglePrepared(article.id)}
                  className='article-checkbox'
                />

                <div className='article-info'>
                  <div className='article-name'>{article.label}</div>
                  <div className='article-details'>
                    Stock: {article.stock} | Emplacement: {article.locationId}
                  </div>
                </div>

                {preparedItems.has(article.id) && (
                  <span className='article-checkmark'>✓</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Boutons d'action */}
        <div className='action-buttons'>
          <button onClick={cancelPreparation} className='btn-cancel'>
            Annuler
          </button>

          <button
            onClick={finishPreparation}
            disabled={!allPrepared}
            className='btn-finish'
          >
            {allPrepared
              ? '🚀 Finaliser la préparation'
              : 'Préparation en cours...'}
          </button>
        </div>
      </div>
    </div>
  );
}
