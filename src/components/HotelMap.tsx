import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { HotelRecord } from '../types';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface HotelMapProps {
  hotels: HotelRecord[];
  selectedHotel: HotelRecord | null;
  defaultCenter: [number, number];
  onSelectHotel: (hotelId: string) => void;
}

function MapController({ hotels, selectedHotel }: { hotels: HotelRecord[]; selectedHotel: HotelRecord | null }) {
  const map = useMap();

  const coordinates = useMemo(
    () => hotels.filter((hotel) => hotel.latitude !== null && hotel.longitude !== null),
    [hotels],
  );

  useEffect(() => {
    if (selectedHotel?.latitude && selectedHotel.longitude) {
      map.flyTo([selectedHotel.latitude, selectedHotel.longitude], 12, { duration: 0.8 });
      return;
    }

    if (coordinates.length === 0) return;

    const bounds = L.latLngBounds(
      coordinates.map((hotel) => [hotel.latitude as number, hotel.longitude as number] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [coordinates, map, selectedHotel]);

  return null;
}

export function HotelMap({ hotels, selectedHotel, defaultCenter, onSelectHotel }: HotelMapProps) {
  const mappedHotels = hotels.filter((hotel) => hotel.latitude !== null && hotel.longitude !== null);

  return (
    <MapContainer center={defaultCenter} zoom={4} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup chunkedLoading>
        {mappedHotels.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[hotel.latitude as number, hotel.longitude as number]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onSelectHotel(hotel.id),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{hotel.name}</p>
                <p className="text-xs text-slate-600">
                  {hotel.city}, {hotel.state}
                </p>
                <p className="text-xs text-slate-500">{hotel.brand ?? 'Brand unavailable'}</p>
                {hotel.amexUrl ? (
                  <a className="text-xs font-medium text-indigo-600" href={hotel.amexUrl} target="_blank" rel="noreferrer">
                    Open AMEX listing
                  </a>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      <MapController hotels={mappedHotels} selectedHotel={selectedHotel} />
    </MapContainer>
  );
}
