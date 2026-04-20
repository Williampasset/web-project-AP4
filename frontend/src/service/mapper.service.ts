/**
 * Retourne la classe CSS selon le statut de la commande
 * @param status - Statut de la commande ('WAITING', 'PENDING', 'FINISH')
 * @returns Classe CSS correspondante (ex: 'status-waiting')
 */
export function getStatusClass(status: string) {
  switch (status) {
    case 'WAITING':
      return 'status-waiting';
    case 'PENDING':
      return 'status-pending';
    case 'FINISH':
      return 'status-finish';
    default:
      return 'status-default';
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
    case 'FINISH':
      return 'Terminée';
    default:
      return status;
  }
}
