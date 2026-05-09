import { getHeaders } from './api.helper';

// frontend/src/service/api/command-preparation.service.ts
const API_URL = '/api';

export enum ValidationMethod {
  MANUAL = 'MANUAL',
  QR_CODE = 'QR_CODE',
}

/**
 * Mark a command item as picked from its location
 */
export async function markItemPicked(commandItemId: number) {
  const response = await fetch(`${API_URL}/preparation/items/pick`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ commandItemId }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors du marquage de l'article");
  }

  return response.json();
}

type ValidateItemPayload = {
  commandItemId: number;
  method: ValidationMethod;
};

/**
 * Validate a picked item (manual or QR code)
 */
export async function validateItem({
  commandItemId,
  method,
}: ValidateItemPayload) {
  const response = await fetch(`${API_URL}/preparation/items/validate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      commandItemId,
      method,
    }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la validation de l'article");
  }

  return response.json();
}

/**
 * Move all prepared items to loading zone
 */
export async function moveToLoadingZone(commandId: number) {
  const response = await fetch(`${API_URL}/preparation/loading-zone/move`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ commandId }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors du déplacement en zone de chargement');
  }

  return response.json();
}

/**
 * Simulate RFID check for loading zone
 */
export async function simulateRfidCheck(
  commandId: number,
  checksPassed: number,
  checksFailed: number = 0,
) {
  const response = await fetch(
    `${API_URL}/preparation/rfid/check-loading-zone`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        commandId,
        checksPassed,
        checksFailed,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la vérification RFID');
  }

  return response.json();
}

/**
 * Start loading items onto truck
 */
export async function startLoading(commandId: number) {
  const response = await fetch(
    `${API_URL}/preparation/${commandId}/loading/start`,
    {
      method: 'POST',
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Erreur lors du démarrage du chargement');
  }

  return response.json();
}

/**
 * Mark an item as loaded onto truck
 */
export async function loadItemToTruck(commandItemId: number) {
  const response = await fetch(`${API_URL}/preparation/items/load`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ commandItemId }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors du chargement de l'article");
  }

  return response.json();
}

/**
 * Complete loading with final RFID check
 */
export async function completeLoading(commandId: number) {
  const response = await fetch(`${API_URL}/preparation/loading/complete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ commandId }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la finalisation du chargement');
  }

  return response.json();
}

/**
 * Get preparation status for a command
 */
export async function getPreparationStatus(commandId: number) {
  const response = await fetch(
    `${API_URL}/preparation/${commandId}/preparation-status`,
    {
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du statut');
  }

  return response.json();
}
