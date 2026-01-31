import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FilterPanel } from '@/components/FilterPanel';
import { FlightCard } from '@/components/FlightCard';
import { ViewToggle } from '@/components/ViewToggle';
import { GroupedView } from '@/components/GroupedView';
import { MapView } from '@/components/MapView';
import { SortOptions, SortOption } from '@/components/SortOptions';
import { LoadingState, ErrorState, EmptyState } from '@/components/LoadingState';
import { useFlights, useFilteredFlights, useFlightStats } from '@/hooks/useFlights';
import { FlightFilters } from '@/types/flight';

const Index = () => {
  const { flights, loading, error } = useFlights();
  const stats = useFlightStats(flights);
  
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
  const [view, setView] = useState<'list' | 'country' | 'city' | 'map'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [visibleCount, setVisibleCount] = useState(20);

  // Update filters when stats are loaded
  useMemo(() => {
    if (stats.priceRange.max > 0 && filters.maxPrice === Infinity) {
      setFilters(prev => ({
        ...prev,
        minPrice: stats.priceRange.min,
        maxPrice: stats.priceRange.max,
        minDays: stats.daysRange.min,
        maxDays: stats.daysRange.max,
      }));
    }
  }, [stats]);

  const filteredFlights = useFilteredFlights(flights, filters);

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

  if (loading) {
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
            totalFlights={flights.length}
            filteredFlights={filteredFlights.length}
          />
          {view === 'list' && (
            <SortOptions value={sortBy} onChange={setSortBy} />
          )}
        </div>

        {filteredFlights.length === 0 ? (
          <EmptyState />
        ) : view === 'map' ? (
          <MapView flights={filteredFlights} />
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
