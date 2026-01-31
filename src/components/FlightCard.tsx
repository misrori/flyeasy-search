import { Flight } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Calendar, Clock, ExternalLink, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { translateCity, translateCountry } from '@/utils/translations';

interface FlightCardProps {
  flight: Flight;
  index: number;
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

const formatDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
};

export const FlightCard = ({ flight, index }: FlightCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass-card-hover p-5 group"
    >
      {/* Header with city and price */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {translateCity(flight.varos)}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{translateCountry(flight.orszag)}</span>
              <span className="text-border">•</span>
              <span>{flight.repter_id}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="price-badge text-lg">
            {formatPrice(flight.ar)} Ft
          </div>
          <p className="text-xs text-muted-foreground mt-1">{flight.napok} nap</p>
        </div>
      </div>

      {/* Flight details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Outbound */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Plane className="w-3.5 h-3.5" />
            <span>Oda</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">{formatDate(flight.indulas)}</span>
              <span className="text-xs text-muted-foreground">
                {dayTranslations[flight.indulas_nap] || flight.indulas_nap}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm">{flight.indulas_ido.slice(0, 5)}</span>
              <Badge variant="secondary" className="text-xs py-0">
                {timeOfDayTranslations[flight.indulas_napszak] || flight.indulas_napszak}
              </Badge>
            </div>
          </div>
        </div>

        {/* Return */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Plane className="w-3.5 h-3.5 rotate-180" />
            <span>Vissza</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">{formatDate(flight.vissza)}</span>
              <span className="text-xs text-muted-foreground">
                {dayTranslations[flight.vissza_nap] || flight.vissza_nap}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm">{flight.vissza_ido.slice(0, 5)}</span>
              <Badge variant="secondary" className="text-xs py-0">
                {timeOfDayTranslations[flight.vissza_napszak] || flight.vissza_napszak}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer info and book button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {flight.atszallas_oda === 0 && flight.atszallas_vissza === 0 ? (
            <Badge className="bg-success/10 text-success border-success/20">
              Közvetlen járat
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {flight.atszallas_oda > 0 && `Oda: ${flight.atszallas_oda} átszállás`}
              {flight.atszallas_oda > 0 && flight.atszallas_vissza > 0 && ' • '}
              {flight.atszallas_vissza > 0 && `Vissza: ${flight.atszallas_vissza} átszállás`}
            </Badge>
          )}
        </div>
        <Button
          variant="hero"
          size="sm"
          className="group-hover:scale-105"
          onClick={() => window.open(flight.link, '_blank')}
        >
          Foglalás
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
