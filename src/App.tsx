import { useEffect, useMemo, useState } from 'react';
import hotels from './data/hotels.us.fhr.sample.json';
import type { HotelRecord } from './types';
import { HotelMap } from './components/HotelMap';
import { Sidebar } from './components/Sidebar';

const usaCenter: [number, number] = [39.8283, -98.5795];

const normalize = (value: string) => value.trim().toLowerCase();

function App() {
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [mapFocusedView, setMapFocusedView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const hotelRecords = hotels as HotelRecord[];

  const states = useMemo(
    () => Array.from(new Set(hotelRecords.map((hotel) => hotel.state))).sort(),
    [hotelRecords],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          hotelRecords
            .filter((hotel) => selectedState === 'all' || hotel.state === selectedState)
            .map((hotel) => hotel.city),
        ),
      ).sort(),
    [hotelRecords, selectedState],
  );

  const brands = useMemo(
    () =>
      Array.from(
        new Set(hotelRecords.map((hotel) => hotel.brand).filter((brand): brand is string => Boolean(brand))),
      ).sort(),
    [hotelRecords],
  );

  const filteredHotels = useMemo(() => {
    const normalizedQuery = normalize(query);

    return hotelRecords.filter((hotel) => {
      if (selectedState !== 'all' && hotel.state !== selectedState) return false;
      if (selectedCity !== 'all' && hotel.city !== selectedCity) return false;
      if (selectedBrand !== 'all' && hotel.brand !== selectedBrand) return false;

      if (!normalizedQuery) return true;

      const searchable = [hotel.name, hotel.city, hotel.state, hotel.address ?? '', hotel.brand ?? '']
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [hotelRecords, query, selectedState, selectedCity, selectedBrand]);

  const selectedHotel = filteredHotels.find((hotel) => hotel.id === selectedHotelId) ?? null;

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="relative flex h-full">
        <Sidebar
          hotels={loading ? [] : filteredHotels}
          totalCount={hotelRecords.length}
          loading={loading}
          query={query}
          selectedState={selectedState}
          selectedCity={selectedCity}
          selectedBrand={selectedBrand}
          states={states}
          cities={cities}
          brands={brands}
          selectedHotelId={selectedHotelId}
          mapFocusedView={mapFocusedView}
          onToggleMapFocus={() => setMapFocusedView((current) => !current)}
          onQueryChange={setQuery}
          onStateChange={(value) => {
            setSelectedState(value);
            setSelectedCity('all');
          }}
          onCityChange={setSelectedCity}
          onBrandChange={setSelectedBrand}
          onSelectHotel={setSelectedHotelId}
        />

        <div className={mapFocusedView ? 'flex-1' : 'hidden flex-1 md:block'}>
          <HotelMap
            hotels={loading ? [] : filteredHotels}
            selectedHotel={selectedHotel}
            defaultCenter={usaCenter}
            onSelectHotel={(hotelId) => setSelectedHotelId(hotelId)}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
