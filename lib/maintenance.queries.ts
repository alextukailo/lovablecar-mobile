
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { useCarStore } from '../src/entities/car/model/car.store';

import {
    completeMaintenance,
    deleteMaintenanceSchedule,
    fetchMaintenanceSchedule,
    fetchMaintenanceSchedules,
    saveMaintenanceSchedule,
    updateMaintenanceSchedule,
} from './maintenance.api';

import type {
    CompleteMaintenanceInput,
    SaveMaintenanceScheduleInput,
    UpdateMaintenanceScheduleInput,
} from './maintenance.api';

export const maintenanceQueryKeys = {
  all: ['maintenance'] as const,

  byCar: (carId: string) =>
    ['maintenance', 'car', carId] as const,

  detail: (carId: string, scheduleId: string) =>
    [
      'maintenance',
      'car',
      carId,
      'detail',
      scheduleId,
    ] as const,
};

/**
 * Fetches schedules for the currently selected car.
 *
 * No request is sent when no car is selected.
 * Each car has its own cache entry.
 */
export function useMaintenanceSchedules() {
  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  return useQuery({
    queryKey: maintenanceQueryKeys.byCar(
      selectedCarId ?? '',
    ),

    queryFn: () =>
      fetchMaintenanceSchedules(selectedCarId!),

    enabled: Boolean(selectedCarId),
  });
}

/**
 * Fetches schedules for an explicitly specified car.
 */
export function useCarMaintenanceSchedules(
  carId: string | null | undefined,
) {
  return useQuery({
    queryKey: maintenanceQueryKeys.byCar(
      carId ?? '',
    ),

    queryFn: () =>
      fetchMaintenanceSchedules(carId!),

    enabled: Boolean(carId),
  });
}

/**
 * Fetches a single maintenance schedule.
 */
export function useMaintenanceSchedule(
  carId: string | null | undefined,
  scheduleId: string | null | undefined,
) {
  return useQuery({
    queryKey: maintenanceQueryKeys.detail(
      carId ?? '',
      scheduleId ?? '',
    ),

    queryFn: () =>
      fetchMaintenanceSchedule(
        carId!,
        scheduleId!,
      ),

    enabled: Boolean(carId && scheduleId),
  });
}

/**
 * Creates or updates a maintenance schedule.
 *
 * Standard maintenance types reuse an existing
 * schedule for the same car and type.
 */
export function useSaveMaintenanceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      carId,
      data,
    }: {
      carId: string;
      data: SaveMaintenanceScheduleInput;
    }) =>
      saveMaintenanceSchedule(
        carId,
        data,
      ),

    onSuccess: async (_schedule, variables) => {
      await queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.byCar(
          variables.carId,
        ),
      });
    },
  });
}

/**
 * Updates a schedule by its ID.
 */
export function useUpdateMaintenanceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      carId,
      scheduleId,
      data,
    }: {
      carId: string;
      scheduleId: string;
      data: UpdateMaintenanceScheduleInput;
    }) =>
      updateMaintenanceSchedule(
        carId,
        scheduleId,
        data,
      ),

    onSuccess: async (_schedule, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: maintenanceQueryKeys.byCar(
            variables.carId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: maintenanceQueryKeys.detail(
            variables.carId,
            variables.scheduleId,
          ),
        }),
      ]);
    },
  });
}

/**
 * Deletes a schedule and refreshes its car's list.
 */
export function useDeleteMaintenanceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      carId,
      scheduleId,
    }: {
      carId: string;
      scheduleId: string;
    }) =>
      deleteMaintenanceSchedule(
        carId,
        scheduleId,
      ),

    onSuccess: async (_result, variables) => {
      queryClient.removeQueries({
        queryKey: maintenanceQueryKeys.detail(
          variables.carId,
          variables.scheduleId,
        ),
      });

      await queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.byCar(
          variables.carId,
        ),
      });
    },
  });
}

/**
 * Marks a maintenance task as completed.
 *
 * This mutation performs a real database write
 * when mutate() or mutateAsync() is called.
 *
 * On success:
 * - Refresh the car's maintenance schedules.
 * - Refresh the completed schedule's details.
 * - Refresh service-history queries for the car.
 *
 * The mutation must only be triggered after
 * the user confirms the completion.
 */
export function useCompleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      carId,
      scheduleId,
      data,
    }: {
      carId: string;
      scheduleId: string;
      data: CompleteMaintenanceInput;
    }) =>
      completeMaintenance(
        carId,
        scheduleId,
        data,
      ),

    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: maintenanceQueryKeys.byCar(
            variables.carId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: maintenanceQueryKeys.detail(
            variables.carId,
            variables.scheduleId,
          ),
        }),

        // The Home screen fetches service history
        // using ['recent-services', carId].
        queryClient.invalidateQueries({
          queryKey: [
            'recent-services',
            variables.carId,
          ],
        }),

        // Also refresh other service-related queries,
        // if they use this shared prefix.
        queryClient.invalidateQueries({
          queryKey: ['services'],
        }),
      ]);
    },
  });
}
