import './Affectation.css';
import DefaultLayout from '@component/default';

export default function Affectation(){
    return (
        <DefaultLayout>
            <div className="affectation-container">
                <h1>Affectation des commandes</h1>
                <div className="affectation-content">
                    <p>Gérez l'affectation des commandes aux équipes disponibles.</p>
                    <div className="affectation-tasks">
                        <h2>Tâches d'affectation</h2>
                        <ul>
                            <li>Assigner les nouvelles commandes aux équipes</li>
                            <li>Surveiller la charge de travail des équipes</li>
                            <li>Réassigner les commandes si nécessaire</li>
                            <li>Générer des rapports d'affectation</li>
                        </ul>
                    </div>
                    <div className="affectation-actions">
                        <button className="btn-primary">Nouvelle affectation</button>
                        <button className="btn-secondary">Voir les rapports</button>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}