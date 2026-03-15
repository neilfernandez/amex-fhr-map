export interface HotelRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  brand: string | null;
  amexUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  description: string | null;
  isFineHotelsResorts: boolean;
  dataStatus: 'confirmed' | 'incomplete' | 'review';
  source: string;
  sourceLastChecked: string;
}
