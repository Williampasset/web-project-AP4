import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useTruckHistory } from '../../hooks/trucks.hooks';
import { formatDate } from '@service/date.service';
import { useMemo, useState } from 'react';
import type { Trip } from '@type/trip.type';
import './TruckHistory.css';

interface VoyageCommandSummary {
  id: number;
  reference: string;
  clientName: string;
  deliveryAt: string;
  itemsCount: number;
  totalWeight: number;
  totalVolume: number;
}

interface VoyageCard {
  id: string;
  truckImat: string;
  departureAt: string;
  returnAt: string;
  commands: VoyageCommandSummary[];
  clients: string[];
  totalWeight: number;
  totalVolume: number;
}

export default function TruckHistory() {
  const [search, setSearch] = useState('');

  const { data: trips = [], isLoading } = useTruckHistory();

  const history = useMemo<VoyageCard[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const voyagesMap = new Map<string, VoyageCard>();

    trips.forEach((trip: Trip) => {
      const truckImat = trip.truck?.imat ?? `Camion #${trip.truckId}`;
      const departureAt = trip.plannedDepartureAt ?? trip.createdAt;
      const returnAt =
        trip.actualArrivalAt ?? trip.plannedArrivalAt ?? departureAt;
      const voyageKey = trip.reference;

      const commands = trip.deliveryStops
        .filter((stop) => stop.command)
        .map((stop) => {
          const command = stop.command!;
          const itemsCount = command.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const totalWeight = command.items.reduce(
            (sum, item) => sum + (item.article?.weight ?? 0) * item.quantity,
            0,
          );
          const totalVolume = command.items.reduce(
            (sum, item) => sum + (item.article?.volume ?? 0) * item.quantity,
            0,
          );

          return {
            id: command.id,
            reference: command.reference,
            clientName: command.client.name,
            deliveryAt: stop.deliveredAt ?? stop.plannedArrivalAt ?? returnAt,
            itemsCount,
            totalWeight,
            totalVolume,
          };
        });

      voyagesMap.set(voyageKey, {
        id: voyageKey,
        truckImat,
        departureAt,
        returnAt,
        commands: commands.sort(
          (a, b) =>
            new Date(a.deliveryAt).getTime() - new Date(b.deliveryAt).getTime(),
        ),
        clients: Array.from(
          new Set(commands.map((command) => command.clientName)),
        ),
        totalWeight: commands.reduce(
          (sum, command) => sum + command.totalWeight,
          0,
        ),
        totalVolume: commands.reduce(
          (sum, command) => sum + command.totalVolume,
          0,
        ),
      });
    });

    const voyages = Array.from(voyagesMap.values()).sort(
      (a, b) => new Date(b.returnAt).getTime() - new Date(a.returnAt).getTime(),
    );

    if (!normalizedSearch) return voyages;

    return voyages.filter((voyage) => {
      const clientsText = voyage.clients.join(' ').toLowerCase();
      const commandsText = voyage.commands
        .map((command) => command.reference)
        .join(' ')
        .toLowerCase();

      return (
        voyage.truckImat.toLowerCase().includes(normalizedSearch) ||
        clientsText.includes(normalizedSearch) ||
        commandsText.includes(normalizedSearch)
      );
    });
  }, [search]);

  return (
    <DefaultLayout>
      <section className='truck-history'>
        <h1>Historique logistique</h1>

        <div className='truck-history__toolbar'>
          <input
            type='text'
            className='truck-history__search'
            placeholder='Rechercher une commande, un client ou un camion...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isLoading && (
          <Loading message='Chargement de l’historique...' size='large' />
        )}

        {!isLoading && history.length === 0 && (
          <div className='truck-history__empty'>
            Aucune livraison historisée.
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <div className='truck-history__list'>
            {history.map((voyage) => (
              <article key={voyage.id} className='truck-history__card'>
                <div className='truck-history__card-header'>
                  <h2>{voyage.truckImat}</h2>
                  <span>{voyage.commands.length} commande(s)</span>
                </div>

                <div className='truck-history__summary'>
                  <p>
                    Départ: {formatDate(voyage.departureAt)} · Retour:{' '}
                    {formatDate(voyage.returnAt)}
                  </p>
                  <p>Clients: {voyage.clients.join(', ')}</p>
                  <p>
                    Total voyage: {voyage.totalWeight.toFixed(2)} kg ·{' '}
                    {voyage.totalVolume.toFixed(2)} m³
                  </p>
                </div>

                <ul className='truck-history__trip-list'>
                  {voyage.commands.map((trip, index) => (
                    <li key={trip.id} className='truck-history__trip-item'>
                      <div className='truck-history__trip-head'>
                        <strong>
                          Stop #{index + 1} · {trip.reference}
                        </strong>
                        <span>{trip.clientName}</span>
                      </div>
                      <p>Livraison: {formatDate(trip.deliveryAt)}</p>
                      <p>
                        {trip.itemsCount} article(s) ·{' '}
                        {trip.totalWeight.toFixed(2)} kg ·{' '}
                        {trip.totalVolume.toFixed(2)} m³
                      </p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
