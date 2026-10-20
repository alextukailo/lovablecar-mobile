export interface DocumentAsset {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileName?: string;
}

export interface ExtractedServiceData {
  date: string;
  mileage: number;
  serviceName: string;
  totalCost: number;
  currency: string;
  workshop?: string;
  notes?: string;
}
