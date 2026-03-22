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
    default: 'border-blue-400/16',
    blue: 'border-blue-400/28',
    green: 'border-emerald-400/30',
    red: 'border-red-400/28',
  };

  const bgGlow = {
    default: 'shadow-[0_0_0_1px_rgba(59,130,246,0.05),0_0_24px_rgba(37,99,235,0.08)]',
    blue: 'shadow-[0_0_0_1px_rgba(59,130,246,0.07),0_0_28px_rgba(59,130,246,0.12)]',
    green: 'shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_0_28px_rgba(16,185,129,0.11)]',
    red: 'shadow-[0_0_0_1px_rgba(248,113,113,0.05),0_0_24px_rgba(239,68,68,0.10)]',
  };

  return (
    <div
      className={cn(
        "bg-[#061126]/78 backdrop-blur-md border rounded-xl overflow-hidden flex flex-col relative group transition-all duration-300",
        borderColors[accent],
        bgGlow[accent],
        className
      )}
    >
      {/* Tech line decorations */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent opacity-50" />
      
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-blue-400/12 flex justify-between items-center bg-[#030b1d]/88">
          {title && (
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-100/72 flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", {
                'bg-cyan-300/60': accent === 'default',
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