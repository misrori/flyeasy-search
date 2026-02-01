import { useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Flight } from '@/types/flight';
import { Airport, translateAirportCity, translateAirportCountry, translateContinent } from '@/hooks/useAirports';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, ExternalLink, Maximize2, Minimize2, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Budapest coordinates
const BUDAPEST_COORDS: [number, number] = [47.4369, 19.2556];

interface LeafletMapProps {
  flights: Flight[];
  airportMap: { [key: string]: Airport };
  onSelectCity?: (city: string) => void;
  onSelectCountry?: (country: string) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('hu-HU').format(price);
};

// Custom marker icons based on price
const createPriceMarker = (color: string, size: number = 12) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const budapestIcon = L.divIcon({
  className: 'budapest-marker',
  html: `<div style="
    width: 16px;
    height: 16px;
    background-color: hsl(220, 90%, 56%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to handle map view changes
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

type SortOption = 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';

export const LeafletMap = ({ flights, airportMap, onSelectCity, onSelectCountry }: LeafletMapProps) => {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeContinent, setActiveContinent] = useState<string>('Europe');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get map center and zoom based on continent
  const mapSettings = useMemo(() => {
    switch (activeContinent) {
      case 'Europe':
        return { center: [50, 10] as [number, number], zoom: 4 };
      case 'Asia':
        return { center: [25, 80] as [number, number], zoom: 3 };
      case 'Africa':
        return { center: [5, 20] as [number, number], zoom: 3 };
      default:
        return { center: [30, 30] as [number, number], zoom: 2 };
    }
  }, [activeContinent]);

  // Group flights by destination airport and get min price
  const destinations = useMemo(() => {
    const destMap: { [key: string]: { 
      code: string; 
      city: string; 
      country: string;
      continent: string;
      region: string;
      minPrice: number; 
      flights: Flight[];
      coords: [number, number];
      airport: Airport;
    } } = {};

    flights.forEach(flight => {
      const airport = airportMap[flight.repter_id];
      if (!airport) return;

      if (!destMap[flight.repter_id]) {
        destMap[flight.repter_id] = {
          code: flight.repter_id,
          city: airport.city,
          country: airport.country,
          continent: airport.continent,
          region: airport.region,
          minPrice: flight.ar,
          flights: [],
          coords: [airport.lat, airport.lon],
          airport,
        };
      }
      destMap[flight.repter_id].flights.push(flight);
      destMap[flight.repter_id].minPrice = Math.min(destMap[flight.repter_id].minPrice, flight.ar);
    });

    return Object.values(destMap).sort((a, b) => a.minPrice - b.minPrice);
  }, [flights, airportMap]);

  // Filter destinations by continent
  const filteredDestinations = useMemo(() => {
    if (activeContinent === 'all') return destinations;
    return destinations.filter(d => d.continent === activeContinent);
  }, [destinations, activeContinent]);

  // Get unique continents from destinations
  const continents = useMemo(() => {
    return [...new Set(destinations.map(d => d.continent))].filter(Boolean).sort();
  }, [destinations]);

  const selectedDestinationData = useMemo(() => {
    if (!selectedDestination) return null;
    return destinations.find(d => d.code === selectedDestination);
  }, [selectedDestination, destinations]);

  // Sort flights in selected destination
  const sortedSelectedFlights = useMemo(() => {
    if (!selectedDestinationData) return [];
    const sorted = [...selectedDestinationData.flights];
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.ar - b.ar);
      case 'price-desc':
        return sorted.sort((a, b) => b.ar - a.ar);
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.indulas).getTime() - new Date(b.indulas).getTime());
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.indulas).getTime() - new Date(a.indulas).getTime());
      default:
        return sorted;
    }
  }, [selectedDestinationData, sortBy]);

  // Color scale based on price
  const getPriceColor = (price: number) => {
    if (destinations.length === 0) return 'hsl(145, 65%, 45%)';
    const minPrice = Math.min(...destinations.map(d => d.minPrice));
    const maxPrice = Math.max(...destinations.map(d => d.minPrice));
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    
    if (ratio < 0.33) return 'hsl(145, 65%, 45%)'; // Green - cheap
    if (ratio < 0.66) return 'hsl(45, 90%, 50%)'; // Yellow - medium
    return 'hsl(15, 90%, 55%)'; // Orange - expensive
  };

  const getMarkerSize = (flightCount: number) => {
    if (flightCount > 50) return 14;
    if (flightCount > 20) return 12;
    return 10;
  };

  const handleApplyFilters = () => {
    if (selectedDestinationData) {
      if (onSelectCity) {
        // We pass the original city name from the flight data
        const firstFlight = selectedDestinationData.flights[0];
        if (firstFlight) {
          onSelectCity(firstFlight.varos);
        }
      }
      setSelectedDestination(null);
    }
  };

  const handleApplyCountryFilter = () => {
    if (selectedDestinationData) {
      if (onSelectCountry) {
        const firstFlight = selectedDestinationData.flights[0];
        if (firstFlight) {
          onSelectCountry(firstFlight.orszag);
        }
      }
      setSelectedDestination(null);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`glass-card overflow-hidden relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`} 
      style={{ height: isFullscreen ? '100vh' : '600px' }}
    >
      {/* Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <Tabs value={activeContinent} onValueChange={setActiveContinent}>
          <TabsList className="glass-card">
            <TabsTrigger value="all">Összes</TabsTrigger>
            {continents.map(continent => (
              <TabsTrigger key={continent} value={continent}>
                {translateContinent(continent)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Fullscreen button */}
      <Button
        variant="glass"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[1000]"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      <MapContainer
        center={mapSettings.center}
        zoom={mapSettings.zoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <MapController center={mapSettings.center} zoom={mapSettings.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Flight lines */}
        {filteredDestinations.map((dest) => (
          <Polyline
            key={`line-${dest.code}`}
            positions={[BUDAPEST_COORDS, dest.coords]}
            pathOptions={{
              color: selectedDestination === dest.code 
                ? 'hsl(220, 90%, 56%)' 
                : 'rgba(59, 130, 246, 0.3)',
              weight: selectedDestination === dest.code ? 3 : 1,
              dashArray: selectedDestination === dest.code ? undefined : '5, 10',
            }}
          />
        ))}

        {/* Budapest marker */}
        <Marker position={BUDAPEST_COORDS} icon={budapestIcon}>
          <Popup>
            <div className="text-center font-semibold">Budapest</div>
          </Popup>
        </Marker>

        {/* Destination markers */}
        {filteredDestinations.map((dest) => (
          <Marker
            key={dest.code}
            position={dest.coords}
            icon={createPriceMarker(getPriceColor(dest.minPrice), getMarkerSize(dest.flights.length))}
            eventHandlers={{
              click: () => setSelectedDestination(dest.code),
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{translateAirportCity(dest.city)}</p>
                <p className="text-sm text-muted-foreground">{translateAirportCountry(dest.country)}</p>
                <p className="text-primary font-bold">{formatPrice(dest.minPrice)} Ft</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 text-xs z-[1000]">
        <p className="font-medium mb-2">Ár alapján</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(145, 65%, 45%)' }} />
            <span>Olcsó</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45, 90%, 50%)' }} />
            <span>Közepes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(15, 90%, 55%)' }} />
            <span>Drága</span>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          {filteredDestinations.length} úti cél • {flights.length} járat
        </p>
      </div>

      {/* Destination panel */}
      <AnimatePresence>
        {selectedDestinationData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-16 w-96 glass-card p-4 max-h-[calc(100%-32px)] overflow-auto z-[1000]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold text-lg">
                  {translateAirportCity(selectedDestinationData.city)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {translateAirportCountry(selectedDestinationData.country)} • {selectedDestinationData.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  {translateContinent(selectedDestinationData.continent)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDestination(null)}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Legolcsóbb ár</p>
              <p className="text-2xl font-display font-bold text-accent">
                {formatPrice(selectedDestinationData.minPrice)} Ft
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedDestinationData.flights.length} elérhető járat
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleApplyFilters}
              >
                <Filter className="w-3 h-3 mr-1" />
                Szűrés erre a városra
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleApplyCountryFilter}
              >
                <Filter className="w-3 h-3 mr-1" />
                Szűrés országra
              </Button>
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Ár szerint növekvő</SelectItem>
                  <SelectItem value="price-desc">Ár szerint csökkenő</SelectItem>
                  <SelectItem value="date-asc">Dátum szerint növekvő</SelectItem>
                  <SelectItem value="date-desc">Dátum szerint csökkenő</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {sortedSelectedFlights.slice(0, 10).map((flight, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-secondary/30 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Plane className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-medium">
                        {new Date(flight.indulas).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {flight.napok} nap
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs py-0">
                        {flight.indulas_napszak}
                      </Badge>
                      {flight.atszallas_oda === 0 && (
                        <Badge className="text-xs py-0 bg-green-500/10 text-green-600 border-green-500/20">
                          Direkt
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent">{formatPrice(flight.ar)} Ft</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => window.open(flight.link, '_blank')}
                    >
                      Foglalás
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedDestinationData.flights.length > 10 && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                + {selectedDestinationData.flights.length - 10} további járat
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
