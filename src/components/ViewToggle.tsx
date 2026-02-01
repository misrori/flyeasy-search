import { Button } from '@/components/ui/button';
import { LayoutGrid, Globe, MapPin, Map } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type Region = 'Europe' | 'Asia';

interface ViewToggleProps {
  view: 'list' | 'country' | 'city' | 'map';
  setView: (view: 'list' | 'country' | 'city' | 'map') => void;
  totalFlights: number;
  filteredFlights: number;
  region: Region;
  setRegion: (region: Region) => void;
}

export const ViewToggle = ({ 
  view, 
  setView, 
  totalFlights, 
  filteredFlights,
  region,
  setRegion,
}: ViewToggleProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-foreground">
            {filteredFlights.toLocaleString('hu-HU')}
          </span>
          <span className="text-muted-foreground">
            járat
            {filteredFlights !== totalFlights && (
              <span className="text-sm"> (összesen {totalFlights.toLocaleString('hu-HU')})</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl">
          <Button
            variant={view === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('map')}
            className="rounded-lg"
          >
            <Map className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Térkép</span>
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className="rounded-lg"
          >
            <LayoutGrid className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
          <Button
            variant={view === 'country' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('country')}
            className="rounded-lg"
          >
            <Globe className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Országok</span>
          </Button>
          <Button
            variant={view === 'city' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('city')}
            className="rounded-lg"
          >
            <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Városok</span>
          </Button>
        </div>
      </div>

      {/* Region selector - right aligned */}
      <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
        <SelectTrigger className="w-[160px] h-10 bg-card border-border">
          <SelectValue placeholder="Régió" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          <SelectItem value="Europe">🇪🇺 Európa</SelectItem>
          <SelectItem value="Asia">🌏 Ázsia</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
