import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import {
    createCar,
    deleteCarApi,
    fetchCar,
    fetchCars,
    updateCarApi,
} from '../../../../lib/cars.api';

import type {
    CreateCarInput,
    UpdateCarInput,
} from '../../../../lib/cars.api';

export const carQueryKeys = {
  all: ['cars'] as const,
  detail: (id: string) => ['cars', id] as const,
};

export function useCars() {
  return useQuery({
    queryKey: carQueryKeys.all,
    queryFn: fetchCars,
  });
}

export function useCar(id: string | undefined) {
  return useQuery({
    queryKey: carQueryKeys.detail(id ?? ''),
    queryFn: () => fetchCar(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarInput) => createCar(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: carQueryKeys.all,
      });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCarInput;
    }) => updateCarApi(id, data),

    onSuccess: async (_car, variables) => {
      await queryClient.invalidateQueries({
        queryKey: carQueryKeys.all,
      });

      await queryClient.invalidateQueries({
        queryKey: carQueryKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCarApi(id),

    onSuccess: async (_result, id) => {
      queryClient.removeQueries({
        queryKey: carQueryKeys.detail(id),
      });

      await queryClient.invalidateQueries({
        queryKey: carQueryKeys.all,
      });
    },
  });
}
