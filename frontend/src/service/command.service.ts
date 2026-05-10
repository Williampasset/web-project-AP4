import type { Command } from '@type/command.type';

/**
 * Check if a command is late for delivery
 */
export function isCommandLate(command: Command): boolean {
  if (!command.deliveryDate || command.status === 'DELIVERED') return false;
  return new Date(command.deliveryDate) < new Date();
}

/**
 * Get total command value
 */
export function getCommandTotalValue(command: Command): number {
  return command.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
}

/**
 * Get total command weight
 */
export function getCommandTotalWeight(command: Command): number {
  return command.items.reduce(
    (total, item) => total + (item.article?.weight ?? 0) * item.quantity,
    0,
  );
}

/**
 * Get total command volume
 */
export function getCommandTotalVolume(command: Command): number {
  return command.items.reduce(
    (total, item) => total + (item.article?.volume ?? 0) * item.quantity,
    0,
  );
}

/**
 * Check if command has insufficient stock for any item
 */
export function hasCommandInsufficientStock(command: Command): boolean {
  if (command.status === 'DELIVERED' || command.status === 'CANCELLED') {
    return false;
  }

  return command.items.some((item) => {
    const availableStock = item.article?.stock ?? 0;
    return availableStock < item.quantity;
  });
}

/**
 * Check if total command weight exceeds truck's max weight
 */
export function hasCommandWeightOverflow(
  command: Command,
): boolean {
  if (command.status !== 'WAITING' && command.status !== 'PENDING') {
    return false;
  }

  if (!command.truck || command.truck.maxLoad == null) return false;
  return getCommandTotalWeight(command) > command.truck.maxLoad;
}

/**
 * Check if total command volume exceeds truck's max volume
 */
export function hasCommandVolumeOverflow(command: Command): boolean {
  if (command.status !== 'WAITING' && command.status !== 'PENDING') {
    return false;
  }

  if (!command.truck || command.truck.maxVolume == null) return false;
  return getCommandTotalVolume(command) > command.truck.maxVolume;
}
