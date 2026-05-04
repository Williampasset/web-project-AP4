import './Affectation.css';
import DefaultLayout from '@component/default';
import { Link } from 'react-router';
import { useState } from 'react';
import type { User } from '@type/User';
import type { Command } from '@type/command';
import type { StockItem } from '@type/StockItem';

import usersData from '@data/users.json';
import articlesData from '@data/articles.json';
import commandsData from '@data/commands.json';

const users: User[] = usersData.users as User[];
const stocks: StockItem[] = articlesData.articles as StockItem[];
const commands: Command[] = commandsData.commands as Command[];

const getUser = (userId: number) => users.find((u) => u.id === userId);

const isStockSufficient = (cmd: Command): boolean => {
  if (!cmd.articleIds || cmd.articleIds.length === 0) return false;
  return cmd.articleIds.every((articleId) => {
    const stock = stocks.find((s) => s.id === articleId);
    return stock !== undefined && stock.stock > 0;
  });
};

type MissingArticle = {
  articleId: number;
  label: string;
};

const getMissingArticles = (cmd: Command): MissingArticle[] => {
  if (!cmd.articleIds || cmd.articleIds.length === 0) return [];

  return cmd.articleIds
    .map((articleId) => ({
      articleId,
      stock: stocks.find((s) => s.id === articleId),
    }))
    .filter(({ stock }) => stock === undefined || stock.stock <= 0)
    .map(({ articleId, stock }) => ({
      articleId,
      label: stock?.label ?? `Article #${articleId}`,
    }));
};

const getStatusLabel = (status: Command['status']) => {
  switch (status) {
    case 'WAITING':
      return 'En attente';
    case 'PENDING':
      return 'En cours';
    case 'FINISH':
      return 'Terminée';
    default:
      return status;
  }
};

const getStatusClass = (status: Command['status']) => {
  switch (status) {
    case 'WAITING':
      return 'status-waiting';
    case 'PENDING':
      return 'status-pending';
    case 'FINISH':
      return 'status-finish';
    default:
      return '';
  }
};

export default function Affectation() {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'finished'
  >('all');
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCommandId, setSelectedCommandId] = useState<number | null>(
    null,
  );
  const [commandsState, setCommandsState] = useState<Command[]>(commands);

  // Appliquer les filtres
  let filtered = commandsState;

  if (statusFilter === 'active') {
    filtered = filtered.filter((cmd) => cmd.status !== 'FINISH');
  } else if (statusFilter === 'finished') {
    filtered = filtered.filter((cmd) => cmd.status === 'FINISH');
  }

  if (assignmentFilter === 'assigned') {
    filtered = filtered.filter((cmd) => cmd.userId);
  } else if (assignmentFilter === 'unassigned') {
    filtered = filtered.filter((cmd) => !cmd.userId);
  }

  const openAssignModal = (cmdId: number) => {
    setSelectedCommandId(cmdId);
    setModalOpen(true);
  };

  const assignUserToCommand = (userId: number) => {
    if (selectedCommandId === null) return;

    setCommandsState((prevCommands) =>
      prevCommands.map((cmd) =>
        cmd.id === selectedCommandId ? { ...cmd, userId } : cmd,
      ),
    );
    setModalOpen(false);
    setSelectedCommandId(null);
  };

  return (
    <DefaultLayout>
      <div className='affectation-table-wrapper'>
        <h1>Affectation des commandes</h1>

        {/* Filtres */}
        <div className='filters-wrapper'>
          <div className='filter-group'>
            <label>État :</label>
            <button
              className={
                statusFilter === 'all' ? 'filter-btn active' : 'filter-btn'
              }
              onClick={() => setStatusFilter('all')}
            >
              Tous
            </button>
            <button
              className={
                statusFilter === 'active' ? 'filter-btn active' : 'filter-btn'
              }
              onClick={() => setStatusFilter('active')}
            >
              En cours
            </button>
            <button
              className={
                statusFilter === 'finished' ? 'filter-btn active' : 'filter-btn'
              }
              onClick={() => setStatusFilter('finished')}
            >
              Terminées
            </button>
          </div>

          <div className='filter-group'>
            <label>Affectation :</label>
            <button
              className={
                assignmentFilter === 'all' ? 'filter-btn active' : 'filter-btn'
              }
              onClick={() => setAssignmentFilter('all')}
            >
              Tous
            </button>
            <button
              className={
                assignmentFilter === 'assigned'
                  ? 'filter-btn active'
                  : 'filter-btn'
              }
              onClick={() => setAssignmentFilter('assigned')}
            >
              Affectées
            </button>
            <button
              className={
                assignmentFilter === 'unassigned'
                  ? 'filter-btn active'
                  : 'filter-btn'
              }
              onClick={() => setAssignmentFilter('unassigned')}
            >
              Non affectées
            </button>
          </div>
        </div>
        <table className='affectation-table'>
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Statut</th>
              <th>Date de commande</th>
              <th>Stock disponible</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cmd) => {
              const user = getUser(cmd.userId);
              const stockOk = isStockSufficient(cmd);
              const missingArticles = getMissingArticles(cmd);
              return (
                <tr key={cmd.id}>
                  <td>#{cmd.id}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(cmd.status)}`}
                    >
                      {getStatusLabel(cmd.status)}
                    </span>
                  </td>
                  <td>
                    {new Date(cmd.commandDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    {cmd.status === 'FINISH' ? (
                      <span className='stock-completed'>—</span>
                    ) : stockOk ? (
                      <span className='stock-ok'>✓ Suffisant</span>
                    ) : (
                      <span className='stock-ko'>
                        ✗ Insuffisant
                        {missingArticles.length > 0 && (
                          <>
                            {' — Manquant : '}
                            {missingArticles.map((article, index) => (
                              <span key={article.articleId}>
                                <Link
                                  to={`/stock?articleId=${article.articleId}`}
                                >
                                  {article.label}
                                </Link>
                                {index < missingArticles.length - 1
                                  ? ' - '
                                  : ''}
                              </span>
                            ))}
                          </>
                        )}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`assign-btn ${cmd.status !== 'WAITING' ? 'disabled' : ''}`}
                      onClick={() => {
                        if (cmd.status === 'WAITING') {
                          openAssignModal(cmd.id);
                        }
                      }}
                      disabled={cmd.status !== 'WAITING'}
                      title={
                        cmd.status !== 'WAITING'
                          ? 'Impossible de modifier une commande en cours ou terminée'
                          : ''
                      }
                    >
                      {user ? `${user.firstName} ${user.lastName}` : 'Assigner'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5}>Aucune commande correspondant aux filtres.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'assignation */}
      {modalOpen && (
        <div className='modal-overlay' onClick={() => setModalOpen(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Assigner une commande</h2>
              <button
                className='modal-close'
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className='modal-body'>
              <p>Sélectionnez un responsable :</p>
              <div className='user-list'>
                {users.map((user) => (
                  <button
                    key={user.id}
                    className='user-item'
                    onClick={() => assignUserToCommand(user.id)}
                  >
                    {user.firstName} {user.lastName}
                    <span className='user-role'>({user.role})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
