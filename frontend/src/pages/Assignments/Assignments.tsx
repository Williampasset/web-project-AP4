import { useState } from 'react';
import DefaultLayout from '@component/default/DefaultLayout';
import CommandAssignments from '@component/CommandAssignments/CommandAssignments';
import StockJobAssignments from '@component/StockJobAssignments/StockJobAssignments';
import LoadingStageTracking from '@component/LoadingStageTracking/LoadingStageTracking';
import './Assignments.css';

type TabType = 'commands' | 'jobs' | 'loading';

export default function Assignments() {
  const [activeTab, setActiveTab] = useState<TabType>('commands');

  return (
    <DefaultLayout>
      <div className='assignments-page'>
        <div className='assignments-title'>
          <h1>Affectations & Suivi</h1>
          <p>Gestion des affectations de travaux et suivi des étapes</p>
        </div>

        <div className='assignments-tabs'>
          <button
            className={`assignments-tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            📋 Commandes
          </button>
          <button
            className={`assignments-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            📦 Travaux de Stock
          </button>
          <button
            className={`assignments-tab-btn ${activeTab === 'loading' ? 'active' : ''}`}
            onClick={() => setActiveTab('loading')}
          >
            🚚 Suivi Chargement
          </button>
        </div>

        <div className='assignments-content'>
          {activeTab === 'commands' && <CommandAssignments />}
          {activeTab === 'jobs' && <StockJobAssignments />}
          {activeTab === 'loading' && <LoadingStageTracking />}
        </div>
      </div>
    </DefaultLayout>
  );
}
