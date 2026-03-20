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
        'grid grid-cols-1 md:grid-cols-12 gap-4 max-w-7xl mx-auto p-4',
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
    default: 'border-blue-300/18',
    blue: 'border-blue-300/30',
    green: 'border-emerald-400/28',
    red: 'border-cyan-300/24',
  };

  const accentDots = {
    default: 'bg-slate-500',
    blue: 'bg-cyan-300',
    green: 'bg-emerald-400',
    red: 'bg-sky-300',
  };

  const bgGlow = {
    default: 'shadow-[0_0_0_1px_rgba(96,165,250,0.06),0_0_24px_rgba(37,99,235,0.10)]',
    blue: 'shadow-[0_0_0_1px_rgba(96,165,250,0.08),0_0_30px_rgba(37,99,235,0.16)]',
    green: 'shadow-[0_0_0_1px_rgba(52,211,153,0.08),0_0_28px_rgba(16,185,129,0.12)]',
    red: 'shadow-[0_0_0_1px_rgba(125,211,252,0.08),0_0_28px_rgba(34,211,238,0.12)]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-[#071224]/72 backdrop-blur-xl flex flex-col transition-all duration-300',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(96,165,250,0.10),transparent_25%,transparent_75%,rgba(34,211,238,0.06))]',
        borderColors[accent],
        bgGlow[accent],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-300/25 to-transparent" />

      {(title || headerAction) && (
        <div className="relative z-10 flex items-center justify-between border-b border-blue-300/12 bg-[#04101f]/55 px-6 py-4">
          {title && (
            <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-300">
              <span className={cn('h-2 w-2 rounded-full', accentDots[accent])} />
              {title}
            </h3>
          )}
          {headerAction}
        </div>
      )}
      <div className="relative z-10 flex-1 p-6">{children}</div>
    </div>
  );
};
