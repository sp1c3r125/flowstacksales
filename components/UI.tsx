import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, ChevronDown } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const labelClass =
  'text-sm font-mono uppercase tracking-wider font-bold text-cyan-100/68';

const fieldShellClass =
  'w-full rounded-lg border border-blue-300/16 bg-[linear-gradient(180deg,rgba(6,17,38,0.98)_0%,rgba(3,11,29,0.98)_100%)] px-4 py-3 text-slate-100 font-mono text-sm outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_0_0_1px_rgba(37,99,235,0.03)] focus:border-cyan-300/55 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_24px_rgba(34,211,238,0.08)] disabled:cursor-not-allowed disabled:opacity-50';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        <label className={labelClass}>{label}</label>
        <div className="relative group">
          {prefix && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200/42">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              fieldShellClass,
              prefix && 'pl-10',
              suffix && 'pr-8',
              error && 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.45)]',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-cyan-200/42">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="animate-pulse font-mono text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  prefix?: React.ReactNode;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, prefix, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        <label className={labelClass}>{label}</label>
        <div className="relative group">
          {prefix && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200/42">
              {prefix}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              fieldShellClass,
              'appearance-none cursor-pointer',
              prefix && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.45)]',
              className
            )}
            {...props}
          >
            <option value="" disabled className="bg-[#030b1d] text-slate-500">
              Select an option...
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#030b1d] text-slate-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-200/42">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <p className="animate-pulse font-mono text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

interface RangeControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  error?: string;
}

export const RangeControl: React.FC<RangeControlProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix,
  suffix,
  error,
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="group w-full space-y-3">
      <div className="flex items-end justify-between">
        <label className={labelClass}>{label}</label>
        <div className="flex items-center gap-1 rounded border border-blue-300/16 bg-[linear-gradient(180deg,rgba(6,17,38,0.94)_0%,rgba(3,11,29,0.96)_100%)] px-2 py-1 transition-all focus-within:border-cyan-300/55 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.35)]">
          {prefix && <span className="select-none font-mono text-sm text-cyan-200/42">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            className="w-20 appearance-none bg-transparent text-right font-mono text-sm text-slate-100 outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="select-none font-mono text-sm text-cyan-200/42">{suffix}</span>}
        </div>
      </div>

      <div className="relative flex h-6 items-center">
        <div className="absolute h-2 w-full overflow-hidden rounded-full bg-blue-950/90 ring-1 ring-blue-300/12">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-100 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute z-10 h-full w-full cursor-pointer opacity-0"
        />

        <div
          className="pointer-events-none absolute z-0 h-5 w-5 rounded-full border-2 border-cyan-300 bg-slate-50 shadow-[0_0_12px_rgba(34,211,238,0.35)] transition-all duration-100 ease-out group-active:scale-110"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>

      {error && <p className="animate-pulse font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}) => {
  const variants = {
    primary:
      'border border-blue-300/28 bg-gradient-to-b from-blue-500/24 to-cyan-400/14 text-white shadow-[0_0_22px_rgba(37,99,235,0.18)] hover:border-cyan-300/55 hover:from-blue-400/30 hover:to-cyan-300/18',
    secondary:
      'border border-blue-300/16 bg-[linear-gradient(180deg,rgba(10,24,47,0.94)_0%,rgba(4,12,29,0.96)_100%)] text-slate-100 shadow-[0_0_0_1px_rgba(37,99,235,0.03)] hover:border-blue-200/28 hover:bg-[linear-gradient(180deg,rgba(12,28,54,0.96)_0%,rgba(7,18,39,0.98)_100%)]',
    ghost:
      'bg-transparent text-cyan-100/68 hover:bg-blue-500/8 hover:text-cyan-50',
    danger:
      'border border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/20 hover:bg-red-500',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-6 py-3 font-mono text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          PROCESSING...
        </>
      ) : (
        children
      )}
    </button>
  );
};
