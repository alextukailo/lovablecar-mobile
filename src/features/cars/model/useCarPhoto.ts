
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/../lib/api';

export type CarPhotoResponse = {
  url: string | null;
};

export const carPhotoKeys = {
  all: ['car-photos'] as const,
  detail: (carId: string) =>
    ['car-photos', carId] as const,
};

async function fetchCarPhoto(
  carId: string,
): Promise<CarPhotoResponse> {
  const response = await api.get<CarPhotoResponse>(
    `/cars/${encodeURIComponent(carId)}/photo`,
  );

  return response.data;
}

export function useCarPhoto(
  carId: string | null | undefined,
) {
  return useQuery({
    queryKey: carPhotoKeys.detail(carId ?? ''),
    queryFn: () => fetchCarPhoto(carId!),
    enabled: Boolean(carId),
    staleTime: 4 * 60 * 1000,
    refetchInterval: 4 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useDeleteCarPhoto(
  carId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(
        `/cars/${encodeURIComponent(carId)}/photo`,
      );
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: carPhotoKeys.detail(carId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['cars'],
        }),
      ]);
    },
  });
}

export async function refreshCarPhoto(
  queryClient: ReturnType<typeof useQueryClient>,
  carId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: carPhotoKeys.detail(carId),
    }),
    queryClient.invalidateQueries({
      queryKey: ['cars'],
    }),
  ]);
}
