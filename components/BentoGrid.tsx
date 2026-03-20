import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BentoGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-4 max-w-7xl mx-auto p-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
  accent?: 'blue' | 'green' | 'red' | 'default';
}> = ({ children, className, title, headerAction, accent = 'default' }) => {
  const borderColors = {
    default: 'border-slate-800',
    blue: 'border-blue-500/50',
    green: 'border-emerald-500/50',
    red: 'border-red-500/50',
  };

  const bgGlow = {
    default: '',
    blue: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]',
    green: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]',
    red: 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]',
  };

  return (
    <div
      className={cn(
        "bg-slate-900/50 backdrop-blur-sm border rounded-xl overflow-hidden flex flex-col relative group transition-all duration-300",
        borderColors[accent],
        bgGlow[accent],
        className
      )}
    >
      {/* Tech line decorations */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
      
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
          {title && (
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", {
                'bg-slate-600': accent === 'default',
                'bg-blue-500': accent === 'blue',
                'bg-emerald-500': accent === 'green',
                'bg-red-500': accent === 'red',
              })} />
              {title}
            </h3>
          )}
          {headerAction}
        </div>
      )}
      <div className="p-6 flex-1 relative z-10">{children}</div>
    </div>
  );
};