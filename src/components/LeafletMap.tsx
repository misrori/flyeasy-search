import { useMemo, useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Flight } from '@/types/flight';
import { Airport, translateAirportCity, translateAirportCountry, translateContinent } from '@/hooks/useAirports';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, ExternalLink, Maximize2, Minimize2, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Budapest coordinates
const BUDAPEST_COORDS: L.LatLngExpression = [47.4369, 19.2556];

interface LeafletMapProps {
  flights: Flight[];
  airportMap: { [key: string]: Airport };
  onSelectCity?: (city: string) => void;
  onSelectCountry?: (country: string) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('hu-HU').format(price);
};

type SortOption = 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';

interface DestinationData {
  code: string;
  city: string;
  country: string;
  continent: string;
  region: string;
  minPrice: number;
  flights: Flight[];
  coords: [number, number];
  airport: Airport;
}

export const LeafletMap = ({ flights, airportMap, onSelectCity, onSelectCountry }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const linesRef = useRef<L.LayerGroup | null>(null);
  
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeContinent, setActiveContinent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');

  // Group flights by destination airport and get min price
  const destinations = useMemo(() => {
    const destMap: { [key: string]: DestinationData } = {};

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
    
    if (ratio < 0.33) return '#22c55e'; // Green - cheap
    if (ratio < 0.66) return '#eab308'; // Yellow - medium
    return '#f97316'; // Orange - expensive
  };

  const getMarkerSize = (flightCount: number) => {
    if (flightCount > 50) return 14;
    if (flightCount > 20) return 12;
    return 10;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([45, 20], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Add Budapest marker
    const budapestIcon = L.divIcon({
      className: 'budapest-marker',
      html: `<div style="
        width: 16px;
        height: 16px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker(BUDAPEST_COORDS, { icon: budapestIcon })
      .addTo(map)
      .bindPopup('<div class="text-center font-semibold">Budapest</div>');

    // Create layer groups for markers and lines
    markersRef.current = L.layerGroup().addTo(map);
    linesRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and lines when destinations change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !linesRef.current) return;

    // Clear existing markers and lines
    markersRef.current.clearLayers();
    linesRef.current.clearLayers();

    // Add lines and markers for filtered destinations
    filteredDestinations.forEach(dest => {
      // Add line
      const line = L.polyline([BUDAPEST_COORDS, dest.coords], {
        color: selectedDestination === dest.code ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
        weight: selectedDestination === dest.code ? 3 : 1,
        dashArray: selectedDestination === dest.code ? undefined : '5, 10',
      });
      linesRef.current!.addLayer(line);

      // Create marker icon
      const size = getMarkerSize(dest.flights.length);
      const color = getPriceColor(dest.minPrice);
      const markerIcon = L.divIcon({
        className: 'price-marker',
        html: `<div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      // Add marker
      const marker = L.marker(dest.coords, { icon: markerIcon });
      marker.bindPopup(`
        <div class="text-center">
          <p class="font-semibold">${translateAirportCity(dest.city)}</p>
          <p class="text-sm text-gray-500">${translateAirportCountry(dest.country)}</p>
          <p class="text-blue-600 font-bold">${formatPrice(dest.minPrice)} Ft</p>
        </div>
      `);
      marker.on('click', () => {
        setSelectedDestination(dest.code);
      });
      markersRef.current!.addLayer(marker);
    });
  }, [filteredDestinations, selectedDestination, destinations]);

  // Update map view when continent changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    let center: L.LatLngExpression = [45, 20];
    let zoom = 4;

    switch (activeContinent) {
      case 'Europe':
        center = [50, 10];
        zoom = 4;
        break;
      case 'Asia':
        center = [25, 80];
        zoom = 3;
        break;
      case 'Africa':
        center = [5, 20];
        zoom = 3;
        break;
    }

    mapRef.current.setView(center, zoom);
  }, [activeContinent]);

  const handleApplyFilters = () => {
    if (selectedDestinationData) {
      if (onSelectCity) {
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
      // Invalidate map size after fullscreen change
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
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
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2">
        <button
          onClick={() => setActiveContinent('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeContinent === 'all' 
              ? 'bg-primary text-primary-foreground' 
              : 'glass-card hover:bg-secondary'
          }`}
        >
          Összes
        </button>
        {continents.map(continent => (
          <button
            key={continent}
            onClick={() => setActiveContinent(continent)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeContinent === continent 
                ? 'bg-primary text-primary-foreground' 
                : 'glass-card hover:bg-secondary'
            }`}
          >
            {translateContinent(continent)}
          </button>
        ))}
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

      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 text-xs z-[1000]">
        <p className="font-medium mb-2">Ár alapján</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Olcsó</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Közepes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
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
                Szűrés városra
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
