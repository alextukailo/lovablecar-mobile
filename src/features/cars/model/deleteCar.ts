
import {
    QueryClient
} from '@tanstack/react-query';

import { deleteCarApi } from '../../../../lib/cars.api';

/**
 * Deletes a car through the NestJS backend.
 *
 * The backend owns deletion of related service records.
 * This function must not modify Zustand or AsyncStorage.
 *
 * Call only after the user has confirmed deletion.
 */
export async function deleteCarAndServices(
  carId: string,
  queryClient?: QueryClient,
): Promise<void> {
  if (!carId.trim()) {
    throw new Error('A valid car ID is required.');
  }

  await deleteCarApi(carId);

  if (!queryClient) {
    return;
  }

  queryClient.removeQueries({
    queryKey: ['cars', carId],
  });

  await queryClient.invalidateQueries({
    queryKey: ['cars'],
  });
}
