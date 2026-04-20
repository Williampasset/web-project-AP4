/**
 * Formate une chaîne de date ISO en format français lisible
 *
 * @param dateString - Chaîne de date au format ISO (ex: "2026-04-10T09:30:00.000Z")
 * @returns Date formatée en français (ex: "10/04/2026 09:30")
 */
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
