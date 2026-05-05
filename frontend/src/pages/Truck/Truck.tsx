import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useTrucks } from '../../hooks/trucks.hooks';
import { useCommands } from '../../hooks/commands.hooks';
import type { CommandStatus } from '@type/command.type';
import './Truck.css';

const ACTIVE_STATUSES: CommandStatus[] = ['WAITING', 'PENDING'];

export default function Truck() {
  const {
    data: trucks = [],
    isLoading: isLoadingTrucks,
    isError: isErrorTrucks,
    error: trucksError,
    refetch: refetchTrucks,
  } = useTrucks();

  const {
    data: commands = [],
    isLoading: isLoadingCommands,
    isError: isErrorCommands,
    error: commandsError,
    refetch: refetchCommands,
  } = useCommands();

  const isLoading = isLoadingTrucks || isLoadingCommands;
  const isError = isErrorTrucks || isErrorCommands;

  const getTruckUsage = (truckId: number, maxLoad: number, maxVolume: number) => {
    const truckCommands = commands.filter(
      (command) => command.truckId === truckId && ACTIVE_STATUSES.includes(command.status),
    );

    const usedWeight = truckCommands.reduce((commandSum, command) => {
      const commandWeight = command.items.reduce(
        (itemSum, item) => itemSum + (item.article?.weight ?? 0) * item.quantity,
        0,
      );
      return commandSum + commandWeight;
    }, 0);

    const usedVolume = truckCommands.reduce((commandSum, command) => {
      const commandVolume = command.items.reduce(
        (itemSum, item) => itemSum + (item.article?.volume ?? 0) * item.quantity,
        0,
      );
      return commandSum + commandVolume;
    }, 0);

    const weightUsagePercent = maxLoad > 0 ? (usedWeight / maxLoad) * 100 : 0;
    const volumeUsagePercent = maxVolume > 0 ? (usedVolume / maxVolume) * 100 : 0;
    const usagePercent = Math.max(weightUsagePercent, volumeUsagePercent);

    return {
      activeCommandsCount: truckCommands.length,
      usedWeight,
      usedVolume,
      weightUsagePercent,
      volumeUsagePercent,
      usagePercent,
      isOverLimit: weightUsagePercent > 100 || volumeUsagePercent > 100,
    };
  };

  return (
    <DefaultLayout>
      <section className='truck-page'>
        <div className='truck-page__header'>
          <h1>Suivi des camions</h1>
          <p>Capacité poids/volume et taux d'utilisation selon les commandes actives.</p>
        </div>

        {isLoading && <Loading message='Chargement des camions...' size='large' />}

        {isError && (
          <div className='truck-page__feedback truck-page__feedback--error'>
            <p>
              {trucksError instanceof Error
                ? trucksError.message
                : commandsError instanceof Error
                  ? commandsError.message
                  : 'Erreur lors du chargement des camions'}
            </p>
            <button
              type='button'
              onClick={() => {
                refetchTrucks();
                refetchCommands();
              }}
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && trucks.length === 0 && (
          <div className='truck-page__feedback'>Aucun camion trouvé.</div>
        )}

        {!isLoading && !isError && trucks.length > 0 && (
          <div className='truck-page__table-wrapper'>
            <table className='truck-page__table'>
              <thead>
                <tr>
                  <th>Immatriculation</th>
                  <th>Poids max</th>
                  <th>Volume max</th>
                  <th>Utilisation poids</th>
                  <th>Utilisation volume</th>
                  <th>Utilisation globale</th>
                  <th>Commandes actives</th>
                  <th>Alerte</th>
                </tr>
              </thead>
              <tbody>
                {trucks.map((truck) => {
                  const usage = getTruckUsage(truck.id, truck.maxLoad, truck.maxVolume);

                  return (
                    <tr
                      key={truck.id}
                      className={usage.isOverLimit ? 'truck-page__row--alert' : ''}
                    >
                      <td className='truck-page__cell--strong'>{truck.imat}</td>
                      <td>{truck.maxLoad.toFixed(2)} kg</td>
                      <td>{truck.maxVolume.toFixed(2)} m³</td>
                      <td>{usage.weightUsagePercent.toFixed(1)}%</td>
                      <td>{usage.volumeUsagePercent.toFixed(1)}%</td>
                      <td>
                        <span
                          className={`truck-page__usage-badge ${
                            usage.isOverLimit
                              ? 'truck-page__usage-badge--danger'
                              : usage.usagePercent >= 80
                                ? 'truck-page__usage-badge--warning'
                                : 'truck-page__usage-badge--ok'
                          }`}
                        >
                          {usage.usagePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td>{usage.activeCommandsCount}</td>
                      <td>
                        {usage.isOverLimit ? (
                          <span className='truck-page__alert'>⚠️ Dépassement</span>
                        ) : (
                          <span className='truck-page__ok'>OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
