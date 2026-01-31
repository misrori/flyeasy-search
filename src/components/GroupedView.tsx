import { useMemo, useState } from 'react';
import { Flight } from '@/types/flight';
import { FlightCard } from './FlightCard';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, MapPin, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateCity, translateCountry } from '@/utils/translations';

interface GroupedViewProps {
  flights: Flight[];
  groupBy: 'country' | 'city';
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('hu-HU').format(price);
};

export const GroupedView = ({ flights, groupBy }: GroupedViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedData = useMemo(() => {
    const grouped: { [key: string]: { flights: Flight[]; minPrice: number; country?: string; originalName: string } } = {};

    flights.forEach((flight) => {
      const key = groupBy === 'country' ? flight.orszag : flight.varos;
      if (!grouped[key]) {
        grouped[key] = { 
          flights: [], 
          minPrice: Infinity,
          country: groupBy === 'city' ? flight.orszag : undefined,
          originalName: key,
        };
      }
      grouped[key].flights.push(flight);
      grouped[key].minPrice = Math.min(grouped[key].minPrice, flight.ar);
    });

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        displayName: groupBy === 'country' ? translateCountry(name) : translateCity(name),
        flights: data.flights.sort((a, b) => a.ar - b.ar),
        minPrice: data.minPrice,
        count: data.flights.length,
        country: data.country ? translateCountry(data.country) : undefined,
      }))
      .sort((a, b) => a.minPrice - b.minPrice);
  }, [flights, groupBy]);

  const toggleGroup = (name: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="space-y-4">
      {groupedData.map((group, index) => (
        <motion.div
          key={group.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          className="glass-card overflow-hidden"
        >
          <button
            onClick={() => toggleGroup(group.name)}
            className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {groupBy === 'country' ? (
                  <Globe className="w-6 h-6 text-primary" />
                ) : (
                  <MapPin className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-display font-semibold text-lg">{group.displayName}</h3>
                {group.country && (
                  <p className="text-sm text-muted-foreground">{group.country}</p>
                )}
              </div>
              <Badge variant="secondary" className="ml-2">
                {group.count} járat
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Már</p>
                <p className="font-display font-bold text-lg text-accent">
                  {formatPrice(group.minPrice)} Ft
                </p>
              </div>
              {expandedGroups.has(group.name) ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {expandedGroups.has(group.name) && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {group.flights.slice(0, 6).map((flight, idx) => (
                    <FlightCard key={`${flight.link}-${idx}`} flight={flight} index={idx} />
                  ))}
                </div>
                {group.flights.length > 6 && (
                  <div className="px-4 pb-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      És még {group.flights.length - 6} további járat...
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};
