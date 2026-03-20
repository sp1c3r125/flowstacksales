import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, ChevronDown } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const surfaceInputClass =
  'w-full rounded-xl border border-blue-300/22 bg-[#04101f]/88 px-4 py-3 text-sm text-slate-100 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(37,99,235,0.06)] outline-none transition placeholder:text-slate-500 focus:border-cyan-300/65 focus:ring-2 focus:ring-cyan-400/24';

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
        <label className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <div className="relative group">
          {prefix && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              surfaceInputClass,
              'disabled:cursor-not-allowed disabled:opacity-50',
              prefix && 'pl-10',
              suffix && 'pr-8',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="animate-pulse font-mono text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

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
        <label className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <div className="relative group">
          {prefix && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {prefix}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              surfaceInputClass,
              'appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
              prefix && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          >
            <option value="" disabled className="bg-[#04101f] text-slate-500">
              Select an option...
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#04101f] text-slate-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <p className="animate-pulse font-mono text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

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
        <label className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">{label}</label>
        <div className="flex items-center gap-1 rounded-lg border border-blue-300/18 bg-[#04101f]/88 px-2 py-1 transition-all focus-within:border-cyan-300/65 focus-within:ring-2 focus-within:ring-cyan-400/20">
          {prefix && <span className="select-none font-mono text-sm text-slate-500">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            className="w-20 appearance-none bg-transparent text-right font-mono text-sm text-slate-100 outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="select-none font-mono text-sm text-slate-500">{suffix}</span>}
        </div>
      </div>

      <div className="relative flex h-6 items-center">
        <div className="absolute h-2 w-full overflow-hidden rounded-full bg-blue-950/90">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-100 ease-out" style={{ width: `${percentage}%` }} />
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
          className="pointer-events-none absolute z-0 h-5 w-5 rounded-full border-2 border-cyan-300 bg-white shadow-[0_0_14px_rgba(34,211,238,0.45)] transition-all duration-100 ease-out group-active:scale-110"
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
      'border border-cyan-300/40 bg-gradient-to-b from-blue-500/30 to-cyan-400/16 text-blue-50 shadow-[0_0_24px_rgba(59,130,246,0.25)] hover:border-cyan-200/70 hover:from-blue-400/40 hover:to-cyan-300/22 hover:shadow-[0_0_36px_rgba(34,211,238,0.30)]',
    secondary:
      'border border-blue-300/22 bg-[#071224]/78 text-slate-100 hover:border-cyan-300/40 hover:bg-[#0b1730]/86',
    ghost: 'bg-transparent text-slate-400 hover:bg-blue-900/20 hover:text-slate-100',
    danger: 'border border-red-500/60 bg-red-600/90 text-white shadow-lg shadow-red-900/20 hover:bg-red-500',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-6 py-3 font-mono text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
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
