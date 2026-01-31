import { Cloud, Plane } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = () => {
  return (
    <header className="relative overflow-hidden">
      {/* Floating clouds background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-cloud w-64 h-64 -top-20 -left-20 opacity-60" style={{ animationDelay: '0s' }} />
        <div className="floating-cloud w-48 h-48 top-10 right-20 opacity-40" style={{ animationDelay: '5s' }} />
        <div className="floating-cloud w-32 h-32 bottom-0 left-1/3 opacity-50" style={{ animationDelay: '10s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Cloud className="w-12 h-12 md:w-16 md:h-16 text-primary" />
              <Plane className="w-6 h-6 md:w-8 md:h-8 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Felhők
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Fedezd fel a legolcsóbb repülőjáratokat Budapestről. 
            Szűrj napszakra, napra, és találd meg a tökéletes utazást.
          </p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-6"
          >
            <div className="glass-card px-4 py-2">
              <span className="text-sm text-muted-foreground">Napi frissítés</span>
            </div>
            <div className="glass-card px-4 py-2">
              <span className="text-sm text-muted-foreground">Közvetlen foglalás</span>
            </div>
            <div className="glass-card px-4 py-2">
              <span className="text-sm text-muted-foreground">Budapest indulás</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
};
