import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Globe, MapPin } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'country' | 'city';
  setView: (view: 'list' | 'country' | 'city') => void;
  totalFlights: number;
  filteredFlights: number;
}

export const ViewToggle = ({ view, setView, totalFlights, filteredFlights }: ViewToggleProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-display font-bold text-foreground">
          {filteredFlights.toLocaleString('hu-HU')}
        </span>
        <span className="text-muted-foreground">
          járat{filteredFlights !== 1 ? '' : ''} 
          {filteredFlights !== totalFlights && (
            <span className="text-sm"> (összesen {totalFlights.toLocaleString('hu-HU')})</span>
          )}
        </span>
      </div>
      
      <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl">
        <Button
          variant={view === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView('list')}
          className="rounded-lg"
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Lista
        </Button>
        <Button
          variant={view === 'country' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView('country')}
          className="rounded-lg"
        >
          <Globe className="w-4 h-4 mr-2" />
          Országok
        </Button>
        <Button
          variant={view === 'city' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView('city')}
          className="rounded-lg"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Városok
        </Button>
      </div>
    </div>
  );
};
