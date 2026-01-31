import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps';
import { Flight } from '@/types/flight';
import { getAirportCoordinates, BUDAPEST_COORDS, translateCity, translateCountry } from '@/utils/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/continents/europe.json';

interface MapViewProps {
  flights: Flight[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('hu-HU').format(price);
};

export const MapView = ({ flights }: MapViewProps) => {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);

  // Group flights by destination airport and get min price
  const destinations = useMemo(() => {
    const destMap: { [key: string]: { 
      code: string; 
      city: string; 
      country: string;
      minPrice: number; 
      flights: Flight[];
      coords: [number, number];
    } } = {};

    flights.forEach(flight => {
      const coords = getAirportCoordinates(flight.repter_id);
      if (!coords) return;

      if (!destMap[flight.repter_id]) {
        destMap[flight.repter_id] = {
          code: flight.repter_id,
          city: flight.varos,
          country: flight.orszag,
          minPrice: flight.ar,
          flights: [],
          coords,
        };
      }
      destMap[flight.repter_id].flights.push(flight);
      destMap[flight.repter_id].minPrice = Math.min(destMap[flight.repter_id].minPrice, flight.ar);
    });

    return Object.values(destMap).sort((a, b) => a.minPrice - b.minPrice);
  }, [flights]);

  const selectedDestinationData = useMemo(() => {
    if (!selectedDestination) return null;
    return destinations.find(d => d.code === selectedDestination);
  }, [selectedDestination, destinations]);

  // Color scale based on price
  const getPriceColor = (price: number) => {
    const minPrice = Math.min(...destinations.map(d => d.minPrice));
    const maxPrice = Math.max(...destinations.map(d => d.minPrice));
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    
    if (ratio < 0.33) return 'hsl(145, 65%, 45%)'; // Green - cheap
    if (ratio < 0.66) return 'hsl(45, 90%, 50%)'; // Yellow - medium
    return 'hsl(15, 90%, 55%)'; // Orange - expensive
  };

  const getMarkerSize = (flightCount: number) => {
    if (flightCount > 50) return 8;
    if (flightCount > 20) return 6;
    return 5;
  };

  return (
    <div className="glass-card overflow-hidden relative" style={{ height: '600px' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [15, 50],
          scale: 800,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup center={[15, 50]} zoom={1} minZoom={0.5} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="hsl(var(--secondary))"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'hsl(var(--muted))' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Flight lines */}
          {destinations.map((dest) => (
            <Line
              key={`line-${dest.code}`}
              from={BUDAPEST_COORDS}
              to={dest.coords}
              stroke={selectedDestination === dest.code || hoveredDestination === dest.code 
                ? 'hsl(var(--primary))' 
                : 'hsl(var(--primary) / 0.2)'}
              strokeWidth={selectedDestination === dest.code || hoveredDestination === dest.code ? 2 : 0.5}
              strokeLinecap="round"
            />
          ))}

          {/* Budapest marker */}
          <Marker coordinates={BUDAPEST_COORDS}>
            <circle r={10} fill="hsl(var(--primary))" stroke="#fff" strokeWidth={2} />
            <text
              textAnchor="middle"
              y={-15}
              style={{ 
                fontFamily: 'Poppins', 
                fontSize: '10px', 
                fontWeight: 600,
                fill: 'hsl(var(--foreground))',
              }}
            >
              Budapest
            </text>
          </Marker>

          {/* Destination markers */}
          {destinations.map((dest) => (
            <Marker
              key={dest.code}
              coordinates={dest.coords}
              onClick={() => setSelectedDestination(dest.code)}
              onMouseEnter={() => setHoveredDestination(dest.code)}
              onMouseLeave={() => setHoveredDestination(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={getMarkerSize(dest.flights.length)}
                fill={getPriceColor(dest.minPrice)}
                stroke="#fff"
                strokeWidth={1.5}
                opacity={hoveredDestination === dest.code || selectedDestination === dest.code ? 1 : 0.8}
              />
              {(hoveredDestination === dest.code || selectedDestination === dest.code) && (
                <text
                  textAnchor="middle"
                  y={-12}
                  style={{ 
                    fontFamily: 'Inter', 
                    fontSize: '9px', 
                    fontWeight: 500,
                    fill: 'hsl(var(--foreground))',
                  }}
                >
                  {translateCity(dest.city)}
                </text>
              )}
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 text-xs">
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
      </div>

      {/* Destination panel */}
      <AnimatePresence>
        {selectedDestinationData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 w-80 glass-card p-4 max-h-[550px] overflow-auto"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold text-lg">
                  {translateCity(selectedDestinationData.city)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {translateCountry(selectedDestinationData.country)} • {selectedDestinationData.code}
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

            <div className="space-y-2">
              {selectedDestinationData.flights.slice(0, 5).map((flight, idx) => (
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
                        <Badge className="text-xs py-0 bg-success/10 text-success border-success/20">
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
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedDestinationData.flights.length > 5 && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                + {selectedDestinationData.flights.length - 5} további járat
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
