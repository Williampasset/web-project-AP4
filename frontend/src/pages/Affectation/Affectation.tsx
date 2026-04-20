import './Affectation.css';
import DefaultLayout from '@component/default';

export default function Affectation(){
    return (
        <DefaultLayout>
            <h1>Suivis des effectifs</h1>
            <div className="affectation-table-wrapper">
                <h1>Affectation des commandes</h1>
                <table className="affectation-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Commande associée</th>
                            <th>Priorité</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Dupont</td>
                            <td>Jean</td>
                            <td>Commande #A123</td>
                            <td className="priority-high">Haute</td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td>Dupont</td>
                            <td>Jean</td>
                            <td>Commande #A124</td>
                            <td className="priority-medium">Moyenne</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Martin</td>
                            <td>Claire</td>
                            <td>Commande #B456</td>
                            <td className="priority-medium">Moyenne</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Bernard</td>
                            <td>Luc</td>
                            <td>Commande #C789</td>
                            <td className="priority-low">Basse</td>
                        </tr>
                    </tbody>
                </table>
                <div className="affectation-pending-wrapper">
                    <h2>Commandes en attente de préparation</h2>
                    <table className="affectation-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Commande</th>
                                <th>Date de départ</th>
                                <th>Stock disponible</th>
                                <th>Priorité</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>101</td>
                                <td>Commande #D001</td>
                                <td>2026-04-14</td>
                                <td>Stock suffisant</td>
                                <td className="priority-high">Haute</td>
                            </tr>
                            <tr>
                                <td>102</td>
                                <td>Commande #D002</td>
                                <td>2026-04-18</td>
                                <td>Stock insuffisant</td>
                                <td className="priority-high">Haute</td>
                            </tr>
                            <tr>
                                <td>103</td>
                                <td>Commande #D003</td>
                                <td>2026-04-22</td>
                                <td>Stock suffisant</td>
                                <td className="priority-medium">Moyenne</td>
                            </tr>
                            <tr>
                                <td>104</td>
                                <td>Commande #D004</td>
                                <td>2026-04-27</td>
                                <td>Stock insuffisant</td>
                                <td className="priority-medium">Moyenne</td>
                            </tr>
                            <tr>
                                <td>105</td>
                                <td>Commande #D005</td>
                                <td>2026-05-02</td>
                                <td>Stock suffisant</td>
                                <td className="priority-low">Basse</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </DefaultLayout>
    );
}