import { useCarStore } from '../../../store/car.store';
import { useServiceStore } from '../../../store/service.store';

export function deleteCarAndServices(carId: string): void {
  // TODO:Remove dependent records first, then remove the vehicle.
  useServiceStore.getState().removeServicesForVehicle(carId);
  useCarStore.getState().removeCar(carId);
}
