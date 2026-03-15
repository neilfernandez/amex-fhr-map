import type { HotelRecord } from '../types';

interface SidebarProps {
  hotels: HotelRecord[];
  totalCount: number;
  loading: boolean;
  states: string[];
  cities: string[];
  brands: string[];
  query: string;
  selectedState: string;
  selectedCity: string;
  selectedBrand: string;
  selectedHotelId: string | null;
  mapFocusedView: boolean;
  onToggleMapFocus: () => void;
  onQueryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onSelectHotel: (hotelId: string) => void;
}

const fieldClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition focus:border-indigo-300 focus:shadow-soft';

export function Sidebar({
  hotels,
  totalCount,
  loading,
  states,
  cities,
  brands,
  query,
  selectedState,
  selectedCity,
  selectedBrand,
  selectedHotelId,
  mapFocusedView,
  onToggleMapFocus,
  onQueryChange,
  onStateChange,
  onCityChange,
  onBrandChange,
  onSelectHotel,
}: SidebarProps) {
  return (
    <section className={mapFocusedView ? 'hidden md:block md:w-[430px]' : 'w-full md:w-[430px]'}>
      <div className="flex h-full flex-col border-r border-slate-200 bg-white/95 backdrop-blur">
        <header className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">AMEX FHR USA Explorer</h1>
              <p className="text-xs text-slate-500">Fine Hotels + Resorts properties (US only)</p>
            </div>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 md:hidden"
              onClick={onToggleMapFocus}
              type="button"
            >
              {mapFocusedView ? 'Show List' : 'Show Map'}
            </button>
          </div>

          <input
            className={fieldClassName}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search hotel, city, state, address, brand..."
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              className={fieldClassName}
              value={selectedState}
              onChange={(event) => onStateChange(event.target.value)}
            >
              <option value="all">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              className={fieldClassName}
              value={selectedCity}
              onChange={(event) => onCityChange(event.target.value)}
            >
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              className={fieldClassName}
              value={selectedBrand}
              onChange={(event) => onBrandChange(event.target.value)}
            >
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-600">
            Showing <span className="font-semibold text-slate-900">{loading ? '...' : hotels.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalCount}</span> properties.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              Loading AMEX FHR properties...
            </div>
          ) : hotels.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No hotels match your filters. Try broadening your search terms.
            </div>
          ) : (
            <ul className="space-y-3">
              {hotels.map((hotel) => (
                <li key={hotel.id}>
                  <button
                    type="button"
                    onClick={() => onSelectHotel(hotel.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedHotelId === hotel.id
                        ? 'border-indigo-300 bg-indigo-50 shadow-soft'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{hotel.name}</p>
                    <p className="text-xs text-slate-600">
                      {hotel.city}, {hotel.state}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{hotel.brand ?? 'Brand unavailable'}</p>
                    {hotel.dataStatus !== 'confirmed' && (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        Needs review
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
