import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useTrucks } from '../../hooks/trucks.hooks';
import { useCommands } from '../../hooks/commands.hooks';
import { formatDate } from '@service/date.service';
import { useMemo, useState } from 'react';
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

  const { data: trucks = [], isLoading: isLoadingTrucks } = useTrucks();
  const { data: commands = [], isLoading: isLoadingCommands } = useCommands({
    status: 'DELIVERED',
  });

  const isLoading = isLoadingTrucks || isLoadingCommands;

  const history = useMemo<VoyageCard[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const truckById = new Map(trucks.map((truck) => [truck.id, truck.imat]));

    // Voyage = commandes livrées du même camion le même jour de retour
    const voyagesMap = new Map<string, VoyageCard>();

    commands.forEach((command) => {
      if (!command.truckId) return;

      const truckImat = truckById.get(command.truckId) ?? `Camion #${command.truckId}`;
      const returnAt = command.deliveryDate ?? command.commandDate;
      const returnDay = new Date(returnAt).toISOString().slice(0, 10);
      const voyageKey = `${command.truckId}-${returnDay}`;

      const commandWeight = command.items.reduce(
        (sum, item) => sum + (item.article?.weight ?? 0) * item.quantity,
        0,
      );
      const commandVolume = command.items.reduce(
        (sum, item) => sum + (item.article?.volume ?? 0) * item.quantity,
        0,
      );
      const itemsCount = command.items.reduce((sum, item) => sum + item.quantity, 0);

      const existing = voyagesMap.get(voyageKey);

      if (!existing) {
        voyagesMap.set(voyageKey, {
          id: voyageKey,
          truckImat,
          departureAt: command.commandDate,
          returnAt,
          commands: [
            {
              id: command.id,
              reference: command.reference,
              clientName: command.client.name,
              deliveryAt: returnAt,
              itemsCount,
              totalWeight: commandWeight,
              totalVolume: commandVolume,
            },
          ],
          clients: [command.client.name],
          totalWeight: commandWeight,
          totalVolume: commandVolume,
        });
        return;
      }

      existing.commands.push({
        id: command.id,
        reference: command.reference,
        clientName: command.client.name,
        deliveryAt: returnAt,
        itemsCount,
        totalWeight: commandWeight,
        totalVolume: commandVolume,
      });
      existing.clients = Array.from(new Set([...existing.clients, command.client.name]));
      existing.totalWeight += commandWeight;
      existing.totalVolume += commandVolume;

      if (new Date(command.commandDate) < new Date(existing.departureAt)) {
        existing.departureAt = command.commandDate;
      }
      if (new Date(returnAt) > new Date(existing.returnAt)) {
        existing.returnAt = returnAt;
      }
    });

    const voyages = Array.from(voyagesMap.values())
      .map((voyage) => ({
        ...voyage,
        commands: [...voyage.commands].sort(
          (a, b) => new Date(a.deliveryAt).getTime() - new Date(b.deliveryAt).getTime(),
        ),
      }))
      .sort(
        (a, b) => new Date(b.returnAt).getTime() - new Date(a.returnAt).getTime(),
      );

    if (!normalizedSearch) return voyages;

    return voyages.filter((voyage) => {
      const clientsText = voyage.clients.join(' ').toLowerCase();
      const commandsText = voyage.commands.map((command) => command.reference).join(' ').toLowerCase();

      return (
        voyage.truckImat.toLowerCase().includes(normalizedSearch) ||
        clientsText.includes(normalizedSearch) ||
        commandsText.includes(normalizedSearch)
      );
    });
  }, [trucks, commands, search]);

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

        {isLoading && <Loading message='Chargement de l’historique...' size='large' />}

        {!isLoading && history.length === 0 && (
          <div className='truck-history__empty'>Aucune livraison historisée.</div>
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
                    Départ: {formatDate(voyage.departureAt)} · Retour: {formatDate(voyage.returnAt)}
                  </p>
                  <p>
                    Clients: {voyage.clients.join(', ')}
                  </p>
                  <p>
                    Total voyage: {voyage.totalWeight.toFixed(2)} kg · {voyage.totalVolume.toFixed(2)} m³
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
                      <p>
                        Livraison: {formatDate(trip.deliveryAt)}
                      </p>
                      <p>
                        {trip.itemsCount} article(s) · {trip.totalWeight.toFixed(2)} kg · {trip.totalVolume.toFixed(2)} m³
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
