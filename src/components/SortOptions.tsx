import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc' | 'days-asc' | 'days-desc';

interface SortOptionsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const SortOptions = ({ value, onChange }: SortOptionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger className="w-[180px] h-9 bg-secondary/50 border-0 rounded-lg">
          <SelectValue placeholder="Rendezés" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price-asc">Ár szerint ↑</SelectItem>
          <SelectItem value="price-desc">Ár szerint ↓</SelectItem>
          <SelectItem value="date-asc">Dátum szerint ↑</SelectItem>
          <SelectItem value="date-desc">Dátum szerint ↓</SelectItem>
          <SelectItem value="days-asc">Hossz szerint ↑</SelectItem>
          <SelectItem value="days-desc">Hossz szerint ↓</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
