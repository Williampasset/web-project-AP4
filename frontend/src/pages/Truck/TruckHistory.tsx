import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useTrucks } from '../../hooks/trucks.hooks';
import { useCommands } from '../../hooks/commands.hooks';
import './TruckHistory.css';

export default function TruckHistory() {
  const { data: trucks = [], isLoading: isLoadingTrucks } = useTrucks();
  const { data: commands = [], isLoading: isLoadingCommands } = useCommands({
    status: 'DELIVERED',
  });

  const isLoading = isLoadingTrucks || isLoadingCommands;

  const history = trucks
    .map((truck) => {
      const delivered = commands.filter((command) => command.truckId === truck.id);
      return {
        truck,
        delivered,
      };
    })
    .filter((item) => item.delivered.length > 0);

  return (
    <DefaultLayout>
      <section className='truck-history'>
        <h1>Historique logistique</h1>

        {isLoading && <Loading message='Chargement de l’historique...' size='large' />}

        {!isLoading && history.length === 0 && (
          <div className='truck-history__empty'>Aucune livraison historisée.</div>
        )}

        {!isLoading && history.length > 0 && (
          <div className='truck-history__list'>
            {history.map(({ truck, delivered }) => (
              <article key={truck.id} className='truck-history__card'>
                <h2>{truck.imat}</h2>
                <p>{delivered.length} livraison(s) effectuée(s)</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
