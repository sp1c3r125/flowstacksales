import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, ChevronDown } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, prefix, suffix, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        <label className="text-sm font-mono text-slate-400 uppercase tracking-wider font-bold">
          {label}
        </label>
        <div className="relative group">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 font-mono text-sm transition-all outline-none",
              "focus:border-blue-500 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.5)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              prefix && "pl-10",
              suffix && "pr-8",
              error && "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.5)]",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 font-mono animate-pulse">{error}</p>
        )}
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
      <div className="space-y-2 w-full">
        <label className="text-sm font-mono text-slate-400 uppercase tracking-wider font-bold">
          {label}
        </label>
        <div className="relative group">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {prefix}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 font-mono text-sm transition-all outline-none appearance-none cursor-pointer",
              "focus:border-blue-500 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.5)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              prefix && "pl-10",
              error && "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.5)]",
              className
            )}
            {...props}
          >
            <option value="" disabled className="text-slate-500 bg-slate-950">Select an option...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-950">
                {opt.label}
              </option>
            ))}
          </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <ChevronDown size={16} />
            </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 font-mono animate-pulse">{error}</p>
        )}
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
    <div className="space-y-3 w-full group">
      <div className="flex justify-between items-end">
        <label className="text-sm font-mono text-slate-400 uppercase tracking-wider font-bold">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-950/50 border border-slate-800 rounded px-2 py-1 focus-within:border-blue-500 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all">
          {prefix && <span className="text-slate-500 font-mono text-sm select-none">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                if(!isNaN(val)) onChange(val);
            }}
            className="w-20 bg-transparent text-right text-slate-200 font-mono text-sm outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="text-slate-500 font-mono text-sm select-none">{suffix}</span>}
        </div>
      </div>
      
      <div className="relative h-6 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-2 bg-slate-800 rounded-full overflow-hidden">
             {/* Fill */}
             <div 
                className="h-full bg-blue-600 transition-all duration-100 ease-out" 
                style={{ width: `${percentage}%` }}
             />
        </div>
        
        {/* Native Range Input (Invisible but interactive) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {/* Custom Thumb (Visual only, positioned by percentage) */}
        <div 
            className="absolute h-5 w-5 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] pointer-events-none transition-all duration-100 ease-out group-active:scale-110 z-0"
            style={{ 
                left: `calc(${percentage}% - 10px)` 
            }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 font-mono animate-pulse">{error}</p>
      )}
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
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border border-blue-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 border border-red-500',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-6 py-3 font-mono text-sm font-medium transition-all active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed",
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