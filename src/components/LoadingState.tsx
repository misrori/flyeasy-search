import { Cloud, Plane } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoadingState = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <motion.div
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <Cloud className="w-24 h-24 text-primary/30" />
        <motion.div
          animate={{
            x: [-30, 30],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Plane className="w-10 h-10 text-primary" />
        </motion.div>
      </motion.div>
      <p className="mt-6 text-lg text-muted-foreground animate-pulse">
        Járatok betöltése...
      </p>
    </div>
  );
};

export const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Cloud className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-xl font-display font-semibold text-foreground mb-2">
        Hiba történt
      </h2>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  );
};

export const EmptyState = () => {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Plane className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-display font-semibold text-foreground mb-2">
        Nincs találat
      </h2>
      <p className="text-muted-foreground max-w-md">
        A megadott szűrőkkel nem találtunk járatot. Próbáld meg lazítani a feltételeken!
      </p>
    </div>
  );
};
