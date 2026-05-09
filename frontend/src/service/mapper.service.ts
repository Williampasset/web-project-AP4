/**
 * Retourne la classe CSS selon le statut de la commande
 * @param status - Statut de la commande ('WAITING', 'PENDING', 'DELIVERED', 'CANCELLED')
 * @returns Modificateur de classe CSS (ex: 'waiting')
 */
export function getStatusClass(status: string) {
  switch (status) {
    case 'WAITING':
      return 'waiting';
    case 'PENDING':
      return 'pending';
    case 'READY':
      return 'ready';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'default';
  }
}

/**
 * Retourne le libellé du statut en français
 * @param status - Statut de la commande ('WAITING', 'PENDING', 'FINISH')
 * @returns Libellé en français (ex: 'En attente')
 */
export function getStatusLabel(status: string) {
  switch (status) {
    case 'WAITING':
      return 'En attente';
    case 'PENDING':
      return 'En cours';
    case 'READY':
      return 'Prête';
    case 'DELIVERED':
      return 'Terminée';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return status;
  }
}
