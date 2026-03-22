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
        'mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-12',
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
    default: 'border-cyan-300/16',
    blue: 'border-blue-300/24',
    green: 'border-emerald-300/28',
    red: 'border-red-300/24',
  };

  const headerDotColors = {
    default: 'bg-cyan-300/70 shadow-[0_0_12px_rgba(103,232,249,0.28)]',
    blue: 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.32)]',
    green: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.30)]',
    red: 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.30)]',
  };

  const outerGlow = {
    default: 'shadow-[0_0_0_1px_rgba(34,211,238,0.04),0_12px_48px_rgba(2,12,27,0.26)]',
    blue: 'shadow-[0_0_0_1px_rgba(96,165,250,0.05),0_12px_48px_rgba(2,12,27,0.28)]',
    green: 'shadow-[0_0_0_1px_rgba(52,211,153,0.05),0_12px_48px_rgba(2,12,27,0.28)]',
    red: 'shadow-[0_0_0_1px_rgba(248,113,113,0.04),0_12px_48px_rgba(2,12,27,0.28)]',
  };

  const surfaceGradients = {
    default: 'bg-[linear-gradient(145deg,rgba(10,24,47,0.92)_0%,rgba(6,17,38,0.9)_45%,rgba(3,11,29,0.96)_100%)]',
    blue: 'bg-[linear-gradient(145deg,rgba(11,28,58,0.94)_0%,rgba(8,22,49,0.92)_45%,rgba(3,11,29,0.97)_100%)]',
    green: 'bg-[linear-gradient(145deg,rgba(6,26,33,0.94)_0%,rgba(5,20,35,0.92)_45%,rgba(3,11,29,0.97)_100%)]',
    red: 'bg-[linear-gradient(145deg,rgba(30,13,20,0.92)_0%,rgba(14,18,37,0.9)_45%,rgba(3,11,29,0.97)_100%)]',
  };

  const accentTopLine = {
    default: 'via-cyan-300/42',
    blue: 'via-blue-300/44',
    green: 'via-emerald-300/42',
    red: 'via-red-300/42',
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300',
        borderColors[accent],
        surfaceGradients[accent],
        outerGlow[accent],
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-100',
          'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.08),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.04),transparent_34%)] before:content-[""]'
        )}
      />
      <div
        className={cn(
          'absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent to-transparent opacity-70',
          accentTopLine[accent]
        )}
      />
      <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-blue-200/18 to-transparent opacity-60" />

      {(title || headerAction) && (
        <div className="relative z-10 flex items-center justify-between border-b border-blue-300/10 bg-[linear-gradient(180deg,rgba(7,18,39,0.9)_0%,rgba(4,12,29,0.72)_100%)] px-6 py-4">
          {title && (
            <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.28em] text-cyan-100/72">
              <span className={cn('h-2 w-2 rounded-full', headerDotColors[accent])} />
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
