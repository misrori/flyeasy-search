import { useState, useEffect, useMemo } from 'react';
import { Flight, FlightFilters } from '@/types/flight';
import { translateCity, translateCountry } from '@/utils/translations';

const CSV_URL = 'https://raw.githubusercontent.com/misrori/flights2/main/csv_data/last_prices.csv';

export const useFlights = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        
        const parsedFlights: Flight[] = lines.slice(1).map(line => {
          // Handle CSV properly - the link field contains commas in URL parameters
          const values: string[] = [];
          let current = '';
          let inUrl = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === ',' && !inUrl) {
              values.push(current);
              current = '';
            } else {
              current += char;
              if (current.includes('https://')) {
                inUrl = true;
              }
            }
          }
          values.push(current);

          return {
            varos: values[0] || '',
            ar: parseInt(values[1]) || 0,
            napok: parseInt(values[2]) || 0,
            orszag: values[3] || '',
            indulas: values[4] || '',
            indulas_nap: values[5] || '',
            indulas_ido: values[6] || '',
            indulas_napszak: values[7] || '',
            vissza: values[8] || '',
            vissza_nap: values[9] || '',
            vissza_ido: values[10] || '',
            vissza_napszak: values[11] || '',
            atszallas_oda: parseInt(values[12]) || 0,
            atszallas_vissza: parseInt(values[13]) || 0,
            repter_id: values[14] || '',
            link: values[15] || '',
          };
        }).filter(f => f.varos && f.ar > 0);

        setFlights(parsedFlights);
        setLoading(false);
      } catch (err) {
        setError('Hiba az adatok betöltésekor');
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  return { flights, loading, error };
};

export const useFilteredFlights = (flights: Flight[], filters: FlightFilters) => {
  return useMemo(() => {
    return flights.filter(flight => {
      // Search query - search in both original and translated names
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const cityOriginal = flight.varos.toLowerCase();
        const cityTranslated = translateCity(flight.varos).toLowerCase();
        const countryOriginal = flight.orszag.toLowerCase();
        const countryTranslated = translateCountry(flight.orszag).toLowerCase();
        
        if (!cityOriginal.includes(query) && 
            !cityTranslated.includes(query) &&
            !countryOriginal.includes(query) &&
            !countryTranslated.includes(query)) {
          return false;
        }
      }

      // Country filter
      if (filters.country && flight.orszag !== filters.country) {
        return false;
      }

      // City filter
      if (filters.city && flight.varos !== filters.city) {
        return false;
      }

      // Price range
      if (flight.ar < filters.minPrice || flight.ar > filters.maxPrice) {
        return false;
      }

      // Days range
      if (flight.napok < filters.minDays || flight.napok > filters.maxDays) {
        return false;
      }

      // Departure time of day
      if (filters.departureTimeOfDay && flight.indulas_napszak !== filters.departureTimeOfDay) {
        return false;
      }

      // Return time of day
      if (filters.returnTimeOfDay && flight.vissza_napszak !== filters.returnTimeOfDay) {
        return false;
      }

      // Departure day
      if (filters.departureDay && flight.indulas_nap !== filters.departureDay) {
        return false;
      }

      // Return day
      if (filters.returnDay && flight.vissza_nap !== filters.returnDay) {
        return false;
      }

      // Direct flights only
      if (filters.directOnly && (flight.atszallas_oda > 0 || flight.atszallas_vissza > 0)) {
        return false;
      }

      return true;
    });
  }, [flights, filters]);
};

export const useFlightStats = (flights: Flight[]) => {
  return useMemo(() => {
    if (flights.length === 0) {
      return {
        countries: [],
        cities: [],
        priceRange: { min: 0, max: 100000 },
        daysRange: { min: 1, max: 30 },
        timesOfDay: [],
        daysOfWeek: [],
      };
    }

    const countries = [...new Set(flights.map(f => f.orszag))].sort();
    const cities = [...new Set(flights.map(f => f.varos))].sort();
    const prices = flights.map(f => f.ar);
    const days = flights.map(f => f.napok);
    const timesOfDay = [...new Set([
      ...flights.map(f => f.indulas_napszak),
      ...flights.map(f => f.vissza_napszak)
    ])].filter(Boolean).sort();
    const daysOfWeek = [...new Set([
      ...flights.map(f => f.indulas_nap),
      ...flights.map(f => f.vissza_nap)
    ])].filter(Boolean);

    return {
      countries,
      cities,
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      daysRange: { min: Math.min(...days), max: Math.max(...days) },
      timesOfDay,
      daysOfWeek,
    };
  }, [flights]);
};

export const useGroupedFlights = (flights: Flight[], groupBy: 'country' | 'city') => {
  return useMemo(() => {
    const grouped: { [key: string]: { flights: Flight[]; minPrice: number } } = {};

    flights.forEach(flight => {
      const key = groupBy === 'country' ? flight.orszag : flight.varos;
      if (!grouped[key]) {
        grouped[key] = { flights: [], minPrice: Infinity };
      }
      grouped[key].flights.push(flight);
      grouped[key].minPrice = Math.min(grouped[key].minPrice, flight.ar);
    });

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        flights: data.flights,
        minPrice: data.minPrice,
        count: data.flights.length,
      }))
      .sort((a, b) => a.minPrice - b.minPrice);
  }, [flights, groupBy]);
};
