import { Boxes, ClipboardList } from 'lucide-react';
import './OperatorBoardSelector.css';

type OperatorBoardMode = 'commands' | 'stock';

interface OperatorBoardSelectorProps {
  onSelect: (mode: OperatorBoardMode) => void;
  commandsCount: number;
  stockTasksCount: number;
  selectedMode: OperatorBoardMode;
}

export default function OperatorBoardSelector({
  onSelect,
  commandsCount,
  stockTasksCount,
  selectedMode,
}: OperatorBoardSelectorProps) {
  return (
    <div className='operator-board-selector'>
      <div className='operator-board-selector__header'>
        <h2 className='operator-board-selector__title'>Sélectionnez une opération</h2>
        <p className='operator-board-selector__subtitle'>
          Choisissez entre gérer vos commandes ou les tâches de stock
        </p>
      </div>

      <div className='operator-board-selector__menu'>
        <button
          className={`operator-board-selector__option ${
            selectedMode === 'commands' ? 'operator-board-selector__option--active' : ''
          }`}
          onClick={() => onSelect('commands')}
          type='button'
        >
          <div className='operator-board-selector__option-icon'>
            <ClipboardList size={32} />
          </div>
          <div className='operator-board-selector__option-content'>
            <h3 className='operator-board-selector__option-title'>Commandes</h3>
            <p className='operator-board-selector__option-count'>
              {commandsCount} commande{commandsCount !== 1 ? 's' : ''} assignée{commandsCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className='operator-board-selector__option-badge'>
            {commandsCount}
          </div>
        </button>

        <button
          className={`operator-board-selector__option ${
            selectedMode === 'stock' ? 'operator-board-selector__option--active' : ''
          }`}
          onClick={() => onSelect('stock')}
          type='button'
        >
          <div className='operator-board-selector__option-icon'>
            <Boxes size={32} />
          </div>
          <div className='operator-board-selector__option-content'>
            <h3 className='operator-board-selector__option-title'>Tâches de stock</h3>
            <p className='operator-board-selector__option-count'>
              {stockTasksCount} tâche{stockTasksCount !== 1 ? 's' : ''} assignée{stockTasksCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className='operator-board-selector__option-badge'>
            {stockTasksCount}
          </div>
        </button>
      </div>
    </div>
  );
}
