export interface ServiceItem {
  id: string;
  type: 'PART' | 'WORK';
  name: string;
  quantity?: number;
  price?: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  serviceName: string;
  totalCost: number;
  currency: string;
  notes?: string;
  items: ServiceItem[];
  documentUrl?: string;
}
