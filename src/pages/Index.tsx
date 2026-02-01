import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FilterPanel } from '@/components/FilterPanel';
import { FlightCard } from '@/components/FlightCard';
import { ViewToggle, Region } from '@/components/ViewToggle';
import { GroupedView } from '@/components/GroupedView';
import { LeafletMap } from '@/components/LeafletMap';
import { SortOptions, SortOption } from '@/components/SortOptions';
import { LoadingState, ErrorState, EmptyState } from '@/components/LoadingState';
import { useFlights, useFilteredFlights, useFlightStats } from '@/hooks/useFlights';
import { useAirports } from '@/hooks/useAirports';
import { FlightFilters } from '@/types/flight';

const Index = () => {
  const { flights, loading, error } = useFlights();
  const { airportMap, loading: airportsLoading } = useAirports();
  
  // Region is the top-level filter - affects everything
  const [region, setRegion] = useState<Region>('Europe');
  
  // Filter flights by region first (using airport data)
  const regionFilteredFlights = useMemo(() => {
    return flights.filter(flight => {
      const airport = airportMap[flight.repter_id];
      if (!airport) return false;
      return airport.continent === region;
    });
  }, [flights, airportMap, region]);

  // Calculate stats based on region-filtered flights
  const stats = useFlightStats(regionFilteredFlights);
  
  const [filters, setFilters] = useState<FlightFilters>({
    searchQuery: '',
    country: '',
    city: '',
    minPrice: 0,
    maxPrice: Infinity,
    departureTimeOfDay: '',
    returnTimeOfDay: '',
    departureDay: '',
    returnDay: '',
    minDays: 0,
    maxDays: 100,
    directOnly: false,
  });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'list' | 'country' | 'city' | 'map'>('map');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [visibleCount, setVisibleCount] = useState(20);

  // Update filters when stats are loaded or region changes
  useMemo(() => {
    if (stats.priceRange.max > 0) {
      setFilters(prev => ({
        ...prev,
        minPrice: stats.priceRange.min,
        maxPrice: stats.priceRange.max,
        minDays: stats.daysRange.min,
        maxDays: stats.daysRange.max,
      }));
    }
  }, [stats, region]);

  // Apply additional filters on top of region-filtered flights
  const filteredFlights = useFilteredFlights(regionFilteredFlights, filters);

  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.ar - b.ar);
      case 'price-desc':
        return sorted.sort((a, b) => b.ar - a.ar);
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.indulas).getTime() - new Date(b.indulas).getTime());
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.indulas).getTime() - new Date(a.indulas).getTime());
      case 'days-asc':
        return sorted.sort((a, b) => a.napok - b.napok);
      case 'days-desc':
        return sorted.sort((a, b) => b.napok - a.napok);
      default:
        return sorted;
    }
  }, [filteredFlights, sortBy]);

  const visibleFlights = useMemo(() => {
    return sortedFlights.slice(0, visibleCount);
  }, [sortedFlights, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  // Handlers for map filter selection
  const handleSelectCity = (city: string) => {
    setFilters(prev => ({ ...prev, city, country: '' }));
    setView('list');
    setFiltersOpen(true);
  };

  const handleSelectCountry = (country: string) => {
    setFilters(prev => ({ ...prev, country, city: '' }));
    setView('list');
    setFiltersOpen(true);
  };

  // Reset visible count when region changes
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    setVisibleCount(20);
    // Clear city/country filters when region changes
    setFilters(prev => ({ ...prev, city: '', country: '' }));
  };

  if (loading || airportsLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Header />
      
      <main className="container mx-auto px-4">
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          stats={stats}
          isOpen={filtersOpen}
          setIsOpen={setFiltersOpen}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <ViewToggle
            view={view}
            setView={setView}
            totalFlights={regionFilteredFlights.length}
            filteredFlights={filteredFlights.length}
            region={region}
            setRegion={handleRegionChange}
          />
          {view === 'list' && (
            <SortOptions value={sortBy} onChange={setSortBy} />
          )}
        </div>

        {filteredFlights.length === 0 ? (
          <EmptyState />
        ) : view === 'map' ? (
          <LeafletMap 
            flights={filteredFlights} 
            airportMap={airportMap}
            onSelectCity={handleSelectCity}
            onSelectCountry={handleSelectCountry}
            region={region}
          />
        ) : view === 'list' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleFlights.map((flight, index) => (
                <FlightCard
                  key={`${flight.link}-${index}`}
                  flight={flight}
                  index={index}
                />
              ))}
            </div>
            {visibleCount < sortedFlights.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="glass-card px-8 py-3 text-primary font-medium hover:shadow-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  Több járat betöltése ({sortedFlights.length - visibleCount} maradt)
                </button>
              </div>
            )}
          </>
        ) : (
          <GroupedView
            flights={filteredFlights}
            groupBy={view === 'country' ? 'country' : 'city'}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Felhők — Olcsó repülőjegyek Budapestről
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Az árak tájékoztató jellegűek, a foglaláskor változhatnak.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
