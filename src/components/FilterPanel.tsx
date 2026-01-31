import { FlightFilters } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateCountry, translateCity } from '@/utils/translations';

interface FilterPanelProps {
  filters: FlightFilters;
  setFilters: (filters: FlightFilters) => void;
  stats: {
    countries: string[];
    cities: string[];
    priceRange: { min: number; max: number };
    daysRange: { min: number; max: number };
    timesOfDay: string[];
    daysOfWeek: string[];
  };
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const dayTranslations: { [key: string]: string } = {
  Monday: 'Hétfő',
  Tuesday: 'Kedd',
  Wednesday: 'Szerda',
  Thursday: 'Csütörtök',
  Friday: 'Péntek',
  Saturday: 'Szombat',
  Sunday: 'Vasárnap',
};

const timeOfDayTranslations: { [key: string]: string } = {
  reggel: 'Reggel',
  délelőtt: 'Délelőtt',
  délután: 'Délután',
  este: 'Este',
  éjjel: 'Éjjel',
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('hu-HU').format(price);
};

export const FilterPanel = ({
  filters,
  setFilters,
  stats,
  isOpen,
  setIsOpen,
}: FilterPanelProps) => {
  const updateFilter = <K extends keyof FlightFilters>(
    key: K,
    value: FlightFilters[K]
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      country: '',
      city: '',
      minPrice: stats.priceRange.min,
      maxPrice: stats.priceRange.max,
      departureTimeOfDay: '',
      returnTimeOfDay: '',
      departureDay: '',
      returnDay: '',
      minDays: stats.daysRange.min,
      maxDays: stats.daysRange.max,
      directOnly: false,
    });
  };

  const hasActiveFilters = 
    filters.searchQuery ||
    filters.country ||
    filters.city ||
    filters.departureTimeOfDay ||
    filters.returnTimeOfDay ||
    filters.departureDay ||
    filters.returnDay ||
    filters.directOnly ||
    filters.minPrice > stats.priceRange.min ||
    filters.maxPrice < stats.priceRange.max ||
    filters.minDays > stats.daysRange.min ||
    filters.maxDays < stats.daysRange.max;

  // Sort countries and cities by Hungarian name
  const sortedCountries = [...stats.countries].sort((a, b) => 
    translateCountry(a).localeCompare(translateCountry(b), 'hu')
  );
  
  const sortedCities = [...stats.cities].sort((a, b) => 
    translateCity(a).localeCompare(translateCity(b), 'hu')
  );

  return (
    <div className="glass-card p-4 md:p-6 mb-6">
      {/* Search bar - always visible */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Keresés város vagy ország alapján..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-10 h-12 bg-secondary/50 border-0 rounded-xl text-base"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isOpen ? 'default' : 'glass'}
            onClick={() => setIsOpen(!isOpen)}
            className="h-12"
          >
            <Filter className="w-4 h-4" />
            Szűrők
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={resetFilters} className="h-12">
              <X className="w-4 h-4" />
              Törlés
            </Button>
          )}
        </div>
      </div>

      {/* Expandable filters */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Country */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ország</Label>
                <Select
                  value={filters.country}
                  onValueChange={(v) => updateFilter('country', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-0 rounded-xl">
                    <SelectValue placeholder="Összes ország">
                      {filters.country ? translateCountry(filters.country) : 'Összes ország'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes ország</SelectItem>
                    {sortedCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {translateCountry(country)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Város</Label>
                <Select
                  value={filters.city}
                  onValueChange={(v) => updateFilter('city', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-0 rounded-xl">
                    <SelectValue placeholder="Összes város">
                      {filters.city ? translateCity(filters.city) : 'Összes város'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes város</SelectItem>
                    {sortedCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {translateCity(city)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Departure Day */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Indulás napja</Label>
                <Select
                  value={filters.departureDay}
                  onValueChange={(v) => updateFilter('departureDay', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-0 rounded-xl">
                    <SelectValue placeholder="Bármelyik nap" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bármelyik nap</SelectItem>
                    {stats.daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {dayTranslations[day] || day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Return Day */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Visszaút napja</Label>
                <Select
                  value={filters.returnDay}
                  onValueChange={(v) => updateFilter('returnDay', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-0 rounded-xl">
                    <SelectValue placeholder="Bármelyik nap" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bármelyik nap</SelectItem>
                    {stats.daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {dayTranslations[day] || day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Departure Time of Day */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Indulás napszaka</Label>
                <Select
                  value={filters.departureTimeOfDay}
                  onValueChange={(v) => updateFilter('departureTimeOfDay', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-0 rounded-xl">
                    <SelectValue placeholder="Bármikor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bármikor</SelectItem>
                    {stats.timesOfDay.map((time) => (
                      <SelectItem key={time} value={time}>
                        {timeOfDayTranslations[time] || time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Return Time of Day */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Visszaút napszaka</Label>
                <Select
                  value={filters.returnTimeOfDay}
                  onValueChange={(v) => updateFilter('returnTimeOfDay', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-0 rounded-xl">
                    <SelectValue placeholder="Bármikor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bármikor</SelectItem>
                    {stats.timesOfDay.map((time) => (
                      <SelectItem key={time} value={time}>
                        {timeOfDayTranslations[time] || time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range - Dual thumb slider */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Ár tartomány</Label>
                  <span className="text-sm font-medium text-primary">
                    {formatPrice(filters.minPrice)} Ft - {formatPrice(filters.maxPrice)} Ft
                  </span>
                </div>
                <div className="px-1">
                  <Slider
                    value={[filters.minPrice, filters.maxPrice]}
                    min={stats.priceRange.min}
                    max={stats.priceRange.max}
                    step={1000}
                    onValueChange={([min, max]) => {
                      setFilters({ ...filters, minPrice: min, maxPrice: max });
                    }}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(stats.priceRange.min)} Ft</span>
                  <span>{formatPrice(stats.priceRange.max)} Ft</span>
                </div>
              </div>

              {/* Days Range - Dual thumb slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Utazás hossza</Label>
                  <span className="text-sm font-medium text-primary">
                    {filters.minDays} - {filters.maxDays} nap
                  </span>
                </div>
                <div className="px-1">
                  <Slider
                    value={[filters.minDays, filters.maxDays]}
                    min={stats.daysRange.min}
                    max={stats.daysRange.max}
                    step={1}
                    onValueChange={([min, max]) => {
                      setFilters({ ...filters, minDays: min, maxDays: max });
                    }}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.daysRange.min} nap</span>
                  <span>{stats.daysRange.max} nap</span>
                </div>
              </div>

              {/* Direct only */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-primary" />
                  <Label className="text-sm font-medium cursor-pointer">
                    Csak közvetlen járatok
                  </Label>
                </div>
                <Switch
                  checked={filters.directOnly}
                  onCheckedChange={(checked) => updateFilter('directOnly', checked)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
