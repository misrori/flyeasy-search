import { useState, useEffect, useMemo } from 'react';

const AIRPORTS_CSV_URL = 'https://raw.githubusercontent.com/misrori/flights2/main/csv_data/airportrs.csv';

export interface Airport {
  id: string;
  name: string;
  city: string;
  country: string;
  continent: string;
  region: string;
  lon: number;
  lat: number;
  rank: number;
}

// Hungarian translations for cities
const cityTranslations: { [key: string]: string } = {
  'Barcelona': 'Barcelona',
  'Madrid': 'Madrid',
  'Jeddah': 'Dzsidda',
  'Cairo': 'Kairó',
  'Rome': 'Róma',
  'New Delhi': 'Újdelhi',
  'Tel Aviv': 'Tel-Aviv',
  'Dubai': 'Dubaj',
  'Athens': 'Athén',
  'Riyadh': 'Rijád',
  'Istanbul': 'Isztambul',
  'London': 'London',
  'Paris': 'Párizs',
  'Berlin': 'Berlin',
  'Vienna': 'Bécs',
  'Prague': 'Prága',
  'Warsaw': 'Varsó',
  'Amsterdam': 'Amszterdam',
  'Brussels': 'Brüsszel',
  'Milan': 'Milánó',
  'Venice': 'Velence',
  'Florence': 'Firenze',
  'Naples': 'Nápoly',
  'Munich': 'München',
  'Frankfurt': 'Frankfurt',
  'Zurich': 'Zürich',
  'Geneva': 'Genf',
  'Lisbon': 'Lisszabon',
  'Porto': 'Porto',
  'Stockholm': 'Stockholm',
  'Copenhagen': 'Koppenhága',
  'Oslo': 'Oslo',
  'Helsinki': 'Helsinki',
  'Dublin': 'Dublin',
  'Edinburgh': 'Edinburgh',
  'Manchester': 'Manchester',
  'Birmingham': 'Birmingham',
  'Marrakech': 'Marrákes',
  'Casablanca': 'Casablanca',
  'Tunis': 'Tunisz',
  'Bangkok': 'Bangkok',
  'Singapore': 'Szingapúr',
  'Tokyo': 'Tokió',
  'Seoul': 'Szöul',
  'Hong Kong': 'Hongkong',
  'Shanghai': 'Sanghaj',
  'Beijing': 'Peking',
  'Sydney': 'Sydney',
  'Melbourne': 'Melbourne',
  'Auckland': 'Auckland',
  'New York': 'New York',
  'Los Angeles': 'Los Angeles',
  'Chicago': 'Chicago',
  'Miami': 'Miami',
  'Toronto': 'Toronto',
  'Vancouver': 'Vancouver',
  'Mexico City': 'Mexikóváros',
  'Sao Paulo': 'São Paulo',
  'Buenos Aires': 'Buenos Aires',
  'Rio de Janeiro': 'Rio de Janeiro',
  'Colombo': 'Colombo',
  'Maldives': 'Maldív-szigetek',
  'Male': 'Malé',
  'Bali': 'Bali',
  'Denpasar': 'Denpasar',
  'Jakarta': 'Jakarta',
  'Kuala Lumpur': 'Kuala Lumpur',
  'Phuket': 'Phuket',
  'Hanoi': 'Hanoi',
  'Ho Chi Minh City': 'Ho Si Minh-város',
  'Manila': 'Manila',
  'Doha': 'Doha',
  'Abu Dhabi': 'Abu-Dzabi',
  'Muscat': 'Maszkat',
  'Amman': 'Ammán',
  'Beirut': 'Bejrút',
  'Tbilisi': 'Tbiliszi',
  'Baku': 'Baku',
  'Yerevan': 'Jereván',
  'Tenerife': 'Tenerife',
  'Gran Canaria': 'Gran Canaria',
  'Palma de Mallorca': 'Palma de Mallorca',
  'Ibiza': 'Ibiza',
  'Malaga': 'Málaga',
  'Alicante': 'Alicante',
  'Valencia': 'Valencia',
  'Seville': 'Sevilla',
  'Nice': 'Nizza',
  'Marseille': 'Marseille',
  'Lyon': 'Lyon',
  'Bordeaux': 'Bordeaux',
  'Toulouse': 'Toulouse',
  'Krakow': 'Krakkó',
  'Gdansk': 'Gdańsk',
  'Wroclaw': 'Wrocław',
  'Poznan': 'Poznań',
  'Bucharest': 'Bukarest',
  'Cluj-Napoca': 'Kolozsvár',
  'Sofia': 'Szófia',
  'Belgrade': 'Belgrád',
  'Zagreb': 'Zágráb',
  'Split': 'Split',
  'Dubrovnik': 'Dubrovnik',
  'Ljubljana': 'Ljubljana',
  'Bratislava': 'Pozsony',
  'Larnaca': 'Larnaka',
  'Paphos': 'Páfosz',
  'Heraklion': 'Iráklio',
  'Rhodes': 'Rodosz',
  'Corfu': 'Korfu',
  'Santorini': 'Szantorini',
  'Thessaloniki': 'Szaloniki',
  'Antalya': 'Antalya',
  'Bodrum': 'Bodrum',
  'Izmir': 'Izmir',
  'Ankara': 'Ankara',
  'Hurghada': 'Hurghada',
  'Sharm El Sheikh': 'Sharm el-Sheikh',
  'Luxor': 'Luxor',
  'Agadir': 'Agadir',
  'Fes': 'Fez',
  'Cape Town': 'Fokváros',
  'Johannesburg': 'Johannesburg',
  'Nairobi': 'Nairobi',
  'Zanzibar': 'Zanzibár',
  'Mauritius': 'Mauritius',
  'Seychelles': 'Seychelle-szigetek',
};

// Hungarian translations for countries
const countryTranslations: { [key: string]: string } = {
  'Spain': 'Spanyolország',
  'Saudi Arabia': 'Szaúd-Arábia',
  'Egypt': 'Egyiptom',
  'Italy': 'Olaszország',
  'India': 'India',
  'Israel': 'Izrael',
  'United Arab Emirates': 'Egyesült Arab Emírségek',
  'Greece': 'Görögország',
  'Turkey': 'Törökország',
  'United Kingdom': 'Egyesült Királyság',
  'France': 'Franciaország',
  'Germany': 'Németország',
  'Austria': 'Ausztria',
  'Czech Republic': 'Csehország',
  'Czechia': 'Csehország',
  'Poland': 'Lengyelország',
  'Netherlands': 'Hollandia',
  'Belgium': 'Belgium',
  'Switzerland': 'Svájc',
  'Portugal': 'Portugália',
  'Sweden': 'Svédország',
  'Denmark': 'Dánia',
  'Norway': 'Norvégia',
  'Finland': 'Finnország',
  'Ireland': 'Írország',
  'Morocco': 'Marokkó',
  'Tunisia': 'Tunézia',
  'Thailand': 'Thaiföld',
  'Singapore': 'Szingapúr',
  'Japan': 'Japán',
  'South Korea': 'Dél-Korea',
  'China': 'Kína',
  'Australia': 'Ausztrália',
  'New Zealand': 'Új-Zéland',
  'United States': 'Egyesült Államok',
  'USA': 'Egyesült Államok',
  'Canada': 'Kanada',
  'Mexico': 'Mexikó',
  'Brazil': 'Brazília',
  'Argentina': 'Argentína',
  'Sri Lanka': 'Srí Lanka',
  'Maldives': 'Maldív-szigetek',
  'Indonesia': 'Indonézia',
  'Malaysia': 'Malajzia',
  'Vietnam': 'Vietnám',
  'Philippines': 'Fülöp-szigetek',
  'Qatar': 'Katar',
  'Oman': 'Omán',
  'Jordan': 'Jordánia',
  'Lebanon': 'Libanon',
  'Georgia': 'Grúzia',
  'Azerbaijan': 'Azerbajdzsán',
  'Armenia': 'Örményország',
  'Romania': 'Románia',
  'Bulgaria': 'Bulgária',
  'Serbia': 'Szerbia',
  'Croatia': 'Horvátország',
  'Slovenia': 'Szlovénia',
  'Slovakia': 'Szlovákia',
  'Cyprus': 'Ciprus',
  'South Africa': 'Dél-Afrika',
  'Kenya': 'Kenya',
  'Tanzania': 'Tanzánia',
  'Mauritius': 'Mauritius',
  'Seychelles': 'Seychelle-szigetek',
  'Russia': 'Oroszország',
  'Ukraine': 'Ukrajna',
  'Iceland': 'Izland',
  'Malta': 'Málta',
  'Luxembourg': 'Luxemburg',
  'Monaco': 'Monaco',
  'Montenegro': 'Montenegró',
  'Albania': 'Albánia',
  'North Macedonia': 'Észak-Macedónia',
  'Bosnia and Herzegovina': 'Bosznia-Hercegovina',
  'Kosovo': 'Koszovó',
  'Moldova': 'Moldova',
  'Latvia': 'Lettország',
  'Lithuania': 'Litvánia',
  'Estonia': 'Észtország',
  'Belarus': 'Fehéroroszország',
};

// Hungarian translations for regions
const regionTranslations: { [key: string]: string } = {
  'Europe': 'Európa',
  'Asia': 'Ázsia',
  'Africa': 'Afrika',
  'North America': 'Észak-Amerika',
  'South America': 'Dél-Amerika',
  'Oceania': 'Óceánia',
  'Southern Europe': 'Dél-Európa',
  'Western Europe': 'Nyugat-Európa',
  'Northern Europe': 'Észak-Európa',
  'Eastern Europe': 'Kelet-Európa',
  'Western Asia': 'Nyugat-Ázsia',
  'Southern Asia': 'Dél-Ázsia',
  'Eastern Asia': 'Kelet-Ázsia',
  'South-Eastern Asia': 'Délkelet-Ázsia',
  'Northern Africa': 'Észak-Afrika',
  'Eastern Africa': 'Kelet-Afrika',
  'Southern Africa': 'Dél-Afrika',
  'Middle East': 'Közel-Kelet',
};

export const translateAirportCity = (city: string): string => {
  return cityTranslations[city] || city;
};

export const translateAirportCountry = (country: string): string => {
  return countryTranslations[country] || country;
};

export const translateRegion = (region: string): string => {
  return regionTranslations[region] || region;
};

export const translateContinent = (continent: string): string => {
  return regionTranslations[continent] || continent;
};

export const useAirports = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch(AIRPORTS_CSV_URL);
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        const parsedAirports: Airport[] = lines.slice(1).map(line => {
          const values = line.split(',');
          
          return {
            id: values[0] || '',
            name: values[1] || '',
            city: values[2] || '',
            country: values[3] || '',
            continent: values[4] || '',
            region: values[5] || '',
            lon: parseFloat(values[6]) || 0,
            lat: parseFloat(values[7]) || 0,
            rank: parseInt(values[8]) || 0,
          };
        }).filter(a => a.id && a.lat !== 0 && a.lon !== 0);

        setAirports(parsedAirports);
        setLoading(false);
      } catch (err) {
        setError('Hiba a repülőtér adatok betöltésekor');
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  // Create a map for quick lookup by airport ID
  const airportMap = useMemo(() => {
    const map: { [key: string]: Airport } = {};
    airports.forEach(airport => {
      map[airport.id] = airport;
    });
    return map;
  }, [airports]);

  // Get unique continents
  const continents = useMemo(() => {
    return [...new Set(airports.map(a => a.continent))].filter(Boolean).sort();
  }, [airports]);

  // Get unique regions
  const regions = useMemo(() => {
    return [...new Set(airports.map(a => a.region))].filter(Boolean).sort();
  }, [airports]);

  return { 
    airports, 
    airportMap, 
    continents, 
    regions, 
    loading, 
    error,
    getAirport: (id: string) => airportMap[id] || null,
  };
};
