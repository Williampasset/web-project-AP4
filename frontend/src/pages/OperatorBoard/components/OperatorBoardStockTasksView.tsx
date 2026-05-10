import StatCard from '@component/StatCard/StatCard';
import type { AssignedStockTask } from '../operatorBoard.utils';

type Props = {
  assignedStockTasks: AssignedStockTask[];
  onOpenStockTaskDetail: (jobId: number) => void;
};

export default function OperatorBoardStockTasksView({
  assignedStockTasks,
  onOpenStockTaskDetail,
}: Props) {
  return (
    <>
      <div className='operator-board__stats'>
        <StatCard
          label='Total tâches stock'
          value={assignedStockTasks.length}
          variant='default'
        />
        <StatCard
          label='En attente'
          value={assignedStockTasks.filter((task) => task.status === 'PENDING').length}
          variant='pending'
        />
      </div>

      {assignedStockTasks.length === 0 ? (
        <div className='operator-board__empty'>
          <p className='operator-board__empty-text'>
            Aucune tâche de stock affectée
          </p>
        </div>
      ) : (
        <div className='operator-board__stock-tasks'>
          {assignedStockTasks.map((task) => (
            <article key={task.id} className='operator-board__stock-task-card'>
              <div className='operator-board__stock-task-head'>
                <span className='operator-board__stock-task-id'>#{task.id}</span>
                <span className='operator-board__stock-task-type'>{task.type}</span>
              </div>
              <button
                type='button'
                className='operator-board__stock-task-validate'
                onClick={() => onOpenStockTaskDetail(task.id)}
                title='Voir le détail de la tâche'
              >
                <span className='operator-board__stock-task-article'>
                  {task.sourceArticleReference} — {task.sourceArticleLabel}
                </span>
                <span className='operator-board__stock-task-action'>
                  Ouvrir le détail de validation
                </span>
              </button>
              <p className='operator-board__stock-task-meta'>
                Cellule source : {task.sourceLocationCode} · Qté : {task.quantity}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className='operator-board__footer'>
        <p className='operator-board__results-count'>
          {assignedStockTasks.length} tâche
          {assignedStockTasks.length !== 1 ? 's' : ''} affichée
          {assignedStockTasks.length !== 1 ? 's' : ''}
        </p>
      </div>
    </>
  );
}
