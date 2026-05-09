import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useDepartTruck, useTrucks } from '../../hooks/trucks.hooks';
import { useCommands } from '../../hooks/commands.hooks';
import type { CommandStatus } from '@type/command.type';
import { formatDate } from '@service/date.service';
import './Truck.css';

const ACTIVE_STATUSES: CommandStatus[] = [
  'WAITING',
  'PENDING',
  'READY',
  'IN_DELIVERY',
];

type FleetStatus =
  | 'MAINTENANCE'
  | 'IN_DELIVERY'
  | 'LOADING_PENDING'
  | 'AVAILABLE';

export default function Truck() {
  const { mutate: departTruck, isPending: isDepartingTruck } = useDepartTruck();
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

  const getTruckUsage = (
    truckId: number,
    maxLoad: number,
    maxVolume: number,
  ) => {
    const truckCommands = commands.filter(
      (command) =>
        command.truckId === truckId && ACTIVE_STATUSES.includes(command.status),
    );

    const usedWeight = truckCommands.reduce((commandSum, command) => {
      const commandWeight = command.items.reduce(
        (itemSum, item) =>
          itemSum + (item.article?.weight ?? 0) * item.quantity,
        0,
      );
      return commandSum + commandWeight;
    }, 0);

    const usedVolume = truckCommands.reduce((commandSum, command) => {
      const commandVolume = command.items.reduce(
        (itemSum, item) =>
          itemSum + (item.article?.volume ?? 0) * item.quantity,
        0,
      );
      return commandSum + commandVolume;
    }, 0);

    const weightUsagePercent = maxLoad > 0 ? (usedWeight / maxLoad) * 100 : 0;
    const volumeUsagePercent =
      maxVolume > 0 ? (usedVolume / maxVolume) * 100 : 0;
    const usagePercent = Math.max(weightUsagePercent, volumeUsagePercent);

    return {
      truckCommands,
      activeCommandsCount: truckCommands.length,
      usedWeight,
      usedVolume,
      weightUsagePercent,
      volumeUsagePercent,
      usagePercent,
      isOverLimit: weightUsagePercent > 100 || volumeUsagePercent > 100,
    };
  };

  const getFleetStatus = (
    maintenanceEndAt: string | null | undefined,
    hasInDelivery: boolean,
    hasLoadingPending: boolean,
  ): FleetStatus => {
    if (maintenanceEndAt && new Date(maintenanceEndAt) > new Date()) {
      return 'MAINTENANCE';
    }

    if (hasLoadingPending) {
      return 'LOADING_PENDING';
    }

    if (hasInDelivery) {
      return 'IN_DELIVERY';
    }

    return 'AVAILABLE';
  };

  const getStatusLabel = (status: FleetStatus) => {
    switch (status) {
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'IN_DELIVERY':
        return 'En cours de livraison';
      case 'LOADING_PENDING':
        return 'En attente de chargement';
      default:
        return 'Disponible';
    }
  };

  const getEstimatedReturn = (truckCommandDates: Array<string | null>) => {
    const dates = truckCommandDates
      .filter((date): date is string => !!date)
      .map((date) => new Date(date).getTime())
      .filter((time) => !Number.isNaN(time));

    if (dates.length === 0) return null;

    return new Date(Math.max(...dates)).toISOString();
  };

  return (
    <DefaultLayout>
      <section className='truck-page'>
        <div className='truck-page__header'>
          <h1>Flotte de camions</h1>
          <p>
            Statut opérationnel, ordre de passage, résumé des livraisons et
            capacité poids/volume.
          </p>
        </div>

        {isLoading && (
          <Loading message='Chargement des camions...' size='large' />
        )}

        {isError && (
          <div className='truck-page__feedback truck-page__feedback--error'>
            <h3>Erreur de chargement</h3>
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
          <div className='truck-page__fleet'>
            {trucks.map((truck) => {
              const usage = getTruckUsage(
                truck.id,
                truck.maxLoad,
                truck.maxVolume,
              );
              const sortedRoute = [...usage.truckCommands].sort((a, b) => {
                const aDate = a.deliveryDate
                  ? new Date(a.deliveryDate).getTime()
                  : new Date(a.commandDate).getTime();
                const bDate = b.deliveryDate
                  ? new Date(b.deliveryDate).getTime()
                  : new Date(b.commandDate).getTime();
                return aDate - bDate;
              });

              const hasReady = usage.truckCommands.some(
                (command) => command.status === 'READY',
              );
              const hasInDelivery = usage.truckCommands.some(
                (command) => command.status === 'IN_DELIVERY',
              );
              const hasWaiting = usage.truckCommands.some(
                (command) => command.status === 'WAITING',
              );
              const fleetStatus = getFleetStatus(
                truck.maintenanceEndAt,
                hasInDelivery,
                hasWaiting || hasReady,
              );
              const canDepart =
                usage.truckCommands.length > 0 &&
                usage.truckCommands.every((command) => command.status === 'READY');

              const nearestDelivery = sortedRoute[0]?.deliveryDate ?? null;
              const estimatedReturn = getEstimatedReturn(
                sortedRoute.map((command) => command.deliveryDate),
              );

              return (
                <article
                  key={truck.id}
                  className={`truck-page__card ${usage.isOverLimit ? 'truck-page__card--alert' : ''}`}
                >
                  <header className='truck-page__card-header'>
                    <div>
                      <h3>{truck.imat}</h3>
                      <p>
                        Poids max: {truck.maxLoad.toFixed(2)} kg · Volume max:{' '}
                        {truck.maxVolume.toFixed(2)} m³
                      </p>
                    </div>
                    <span
                      className={`truck-page__status truck-page__status--${fleetStatus.toLowerCase()}`}
                    >
                      {getStatusLabel(fleetStatus)}
                    </span>
                  </header>

                  <div className='truck-page__metrics'>
                    <div>
                      <span>Utilisation poids</span>
                      <strong>{usage.weightUsagePercent.toFixed(1)}%</strong>
                    </div>
                    <div>
                      <span>Utilisation volume</span>
                      <strong>{usage.volumeUsagePercent.toFixed(1)}%</strong>
                    </div>
                    <div>
                      <span>Utilisation globale</span>
                      <strong>{usage.usagePercent.toFixed(1)}%</strong>
                    </div>
                  </div>

                  {usage.isOverLimit && (
                    <div className='truck-page__alert-box'>
                      Dépassement de capacité poids/volume
                    </div>
                  )}

                  {usage.truckCommands.some(
                    (command) =>
                      command.status === 'WAITING' ||
                      command.status === 'READY',
                  ) && (
                    <section className='truck-page__section'>
                      <h4>Chargements à venir</h4>
                      <ul className='truck-page__upcoming-list'>
                        {[...usage.truckCommands]
                          .filter(
                            (command) =>
                              command.status === 'WAITING' ||
                              command.status === 'READY',
                          )
                          .map((command) => (
                            <li key={command.id}>
                              <strong>{command.reference}</strong>
                              <span>
                                Date:{' '}
                                {formatDate(
                                  command.deliveryDate ?? command.commandDate,
                                )}
                              </span>
                            </li>
                          ))}
                      </ul>
                      <p className='truck-page__upcoming-next-date'>
                        Prochaine date:{' '}
                        {nearestDelivery
                          ? formatDate(nearestDelivery)
                          : formatDate(usage.truckCommands[0].commandDate)}
                      </p>

                      <button
                        type='button'
                        className='truck-page__depart-button'
                        disabled={!canDepart || isDepartingTruck}
                        onClick={() => departTruck(truck.id)}
                      >
                        Faire partir le camion
                      </button>
                    </section>
                  )}

                  {fleetStatus === 'IN_DELIVERY' && (
                    <section className='truck-page__section'>
                      <h4>Ordre de passage & résumé</h4>
                      <ol className='truck-page__route-list'>
                        {sortedRoute.map((command, index) => {
                          const commandWeight = command.items.reduce(
                            (sum, item) =>
                              sum + (item.article?.weight ?? 0) * item.quantity,
                            0,
                          );
                          const commandVolume = command.items.reduce(
                            (sum, item) =>
                              sum + (item.article?.volume ?? 0) * item.quantity,
                            0,
                          );

                          return (
                            <li key={command.id}>
                              <span className='truck-page__route-order'>
                                #{index + 1}
                              </span>
                              <div>
                                <strong>
                                  {command.client.name} · {command.reference}
                                </strong>
                                <p>
                                  Livraison:{' '}
                                  {command.deliveryDate
                                    ? formatDate(command.deliveryDate)
                                    : 'N/A'}{' '}
                                  · Poids: {commandWeight.toFixed(2)} kg ·
                                  Volume: {commandVolume.toFixed(2)} m³
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                      <p className='truck-page__return'>
                        Retour dépôt estimé:{' '}
                        {estimatedReturn
                          ? formatDate(estimatedReturn)
                          : 'Non défini'}
                      </p>
                    </section>
                  )}

                  {fleetStatus === 'MAINTENANCE' && (
                    <section className='truck-page__section'>
                      <h4>Maintenance</h4>
                      <p>
                        Fin de maintenance prévue:{' '}
                        {truck.maintenanceEndAt
                          ? formatDate(truck.maintenanceEndAt)
                          : 'Non définie'}
                      </p>
                    </section>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
