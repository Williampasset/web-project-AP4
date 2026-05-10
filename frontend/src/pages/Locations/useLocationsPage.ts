import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteZeroStockLocationArticle,
  fetchLocations,
  mergeLocationArticle,
  moveLocationArticle,
  validateStockJob,
} from '@service/api/locations.service';
import { fetchUsers } from '@service/api/users.service';
import type { User } from '@type/user.type';
import type { WarehouseLocation } from '@type/warehouse-location.type';
import { sortByCoordinate, sortByFullCoordinate, toDisplayLocation } from '@utils/location.utils';
import type { Building, DisplayLocation } from '@type/location-view.type';

const normalizeZone = (zone: string) => zone.trim().toUpperCase();

const isPrepZone = (zone: string) => {
  const normalized = normalizeZone(zone);
  return normalized === 'PREP' || normalized === 'PREPARATION';
};

const isTransitZone = (zone: string) => {
  const normalized = normalizeZone(zone);
  return (
    normalized === 'TRANSIT' ||
    normalized === 'INBOUND' ||
    normalized === 'IN'
  );
};

export function useLocationsPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<number | null>(null);
  const [qrModalLocation, setQrModalLocation] = useState<DisplayLocation | null>(null);
  const [moveTargetLocationId, setMoveTargetLocationId] = useState<number | null>(null);
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [mergeTargetArticleId, setMergeTargetArticleId] = useState<number | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: locations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<WarehouseLocation[]>({
    queryKey: ['locations', 'warehouse-view'],
    queryFn: fetchLocations,
    refetchInterval: 15000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    refetchInterval: 30000,
  });

  const buildings = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.building)))
      .filter((b) => b !== 'P')
      .sort((a, b) => a.localeCompare(b));
  }, [locations]);

  const activeBuilding = selectedBuilding ?? buildings[0] ?? null;

  const buildingLocations = useMemo(() => {
    if (!activeBuilding) return [];
    return locations.filter(
      (l) =>
        l.building === activeBuilding &&
        !isPrepZone(l.zone) &&
        !isTransitZone(l.zone),
    );
  }, [locations, activeBuilding]);

  const mappedLocations = useMemo(() => {
    return [...buildingLocations].sort(sortByCoordinate).map(toDisplayLocation);
  }, [buildingLocations]);

  const bulkLocations = useMemo(
    () => mappedLocations.filter((l) => l.zone === 'BULK'),
    [mappedLocations],
  );

  const pickLocations = useMemo(
    () => mappedLocations.filter((l) => l.zone === 'PICK'),
    [mappedLocations],
  );

  const prepLocations = useMemo(() => {
    return locations
      .filter(
        (l) =>
          isPrepZone(l.zone) &&
          l.building === activeBuilding,
      )
      .sort(sortByCoordinate)
      .map(toDisplayLocation);
  }, [locations, activeBuilding]);

  const transitLocations = useMemo(() => {
    return locations
      .filter(
        (l) =>
          isTransitZone(l.zone) &&
          l.building === activeBuilding,
      )
      .sort(sortByCoordinate)
      .map(toDisplayLocation);
  }, [locations, activeBuilding]);

  const focusedLocation =
    mappedLocations.find((cell) => cell.id === focusedLocationId) ??
    prepLocations.find((cell) => cell.id === focusedLocationId) ??
    transitLocations.find((cell) => cell.id === focusedLocationId) ??
    mappedLocations[0] ??
    null;

  const focusedArticle = focusedLocation?.articles?.[0] ?? null;

  useEffect(() => {
    setMoveTargetLocationId(null);
    setMergeTargetArticleId(null);
    setMoveQuantity(1);
    setActionError(null);
  }, [focusedLocationId]);

  useEffect(() => {
    if (!assignedUserId && users.length > 0) {
      setAssignedUserId(users[0].id);
    }
  }, [users, assignedUserId]);

  const availableMoveTargets = useMemo(() => {
    if (!focusedLocation) return [];
    return locations
      .filter((l) => l.id !== focusedLocation.id && l.articles.length === 0)
      .sort(sortByFullCoordinate);
  }, [locations, focusedLocation]);

  const availableMergeTargets = useMemo(() => {
    if (!focusedArticle) return [];
    const label = focusedArticle.label.trim().toLowerCase();
    return locations
      .filter(
        (l) =>
          l.articles.length > 0 &&
          l.articles[0].id !== focusedArticle.id &&
          l.articles[0].label.trim().toLowerCase() === label,
      )
      .sort(sortByFullCoordinate);
  }, [locations, focusedArticle]);

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['locations', 'warehouse-view'] }),
      queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
      queryClient.invalidateQueries({ queryKey: ['articles'] }),
      queryClient.invalidateQueries({ queryKey: ['articles', 'live-stock'] }),
    ]);
  };

  const handleMove = async () => {
    if (!focusedArticle || !moveTargetLocationId || !assignedUserId) return;
    const quantity = Math.max(1, Math.min(moveQuantity, focusedArticle.stock));
    setActionError(null);
    setIsActing(true);
    try {
      await moveLocationArticle(
        focusedArticle.id,
        moveTargetLocationId,
        quantity,
        assignedUserId,
      );
      await refreshData();
      setMoveTargetLocationId(null);
      setMoveQuantity(1);
    } catch (e) {
      setActionError((e as Error).message || 'Échec du déplacement');
    } finally {
      setIsActing(false);
    }
  };

  const handleMerge = async () => {
    if (!focusedArticle || !mergeTargetArticleId || !assignedUserId) return;
    setActionError(null);
    setIsActing(true);
    try {
      await mergeLocationArticle(
        focusedArticle.id,
        mergeTargetArticleId,
        assignedUserId,
      );
      await refreshData();
      setMergeTargetArticleId(null);
    } catch (e) {
      setActionError((e as Error).message || 'Échec de la fusion');
    } finally {
      setIsActing(false);
    }
  };

  const handleValidateJob = async (jobId: number, userId: number) => {
    setActionError(null);
    setIsActing(true);
    try {
      await validateStockJob(jobId, userId);
      await refreshData();
    } catch (e) {
      setActionError((e as Error).message || 'Échec de validation du job');
    } finally {
      setIsActing(false);
    }
  };

  const handleDeleteZeroStock = async () => {
    if (!focusedArticle || focusedArticle.stock !== 0) return;
    setActionError(null);
    setIsActing(true);
    try {
      await deleteZeroStockLocationArticle(focusedArticle.id);
      await refreshData();
    } catch (e) {
      setActionError((e as Error).message || 'Échec de suppression');
    } finally {
      setIsActing(false);
    }
  };

  return {
    isLoading,
    isError,
    error,
    refetch,
    users,
    buildings,
    activeBuilding,
    bulkLocations,
    pickLocations,
    prepLocations,
    transitLocations,
    focusedLocation,
    qrModalLocation,
    assignedUserId,
    isActing,
    actionError,
    moveQuantity,
    moveTargetLocationId,
    mergeTargetArticleId,
    availableMoveTargets,
    availableMergeTargets,
    setSelectedBuilding,
    setFocusedLocationId,
    setQrModalLocation,
    setAssignedUserId,
    setMoveQuantity,
    setMoveTargetLocationId,
    setMergeTargetArticleId,
    handleMove,
    handleMerge,
    handleValidateJob,
    handleDeleteZeroStock,
  };
}
