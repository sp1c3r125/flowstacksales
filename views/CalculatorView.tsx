import React, { useState, useMemo } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Input, Button, RangeControl } from '../components/UI';
import { CalculatorData, CalculatorSchema } from '../types';
import { calculateMonthlyLeakage, calculateAnnualLeakage, formatCurrency } from '../utils/calculations';
import { ArrowRight, Activity, TrendingDown, DollarSign, Layers } from 'lucide-react';

interface Props {
  data: CalculatorData;
  onUpdate: (data: CalculatorData) => void;
  onNext: () => void;
}

export const CalculatorView: React.FC<Props> = ({ data, onUpdate, onNext }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorData, string>>>({});
  const [localData, setLocalData] = useState<CalculatorData>(data);

  // Optimized real-time calculation for display
  const monthlyLeakage = useMemo(() =>
    calculateMonthlyLeakage(localData.volume, localData.value, localData.rate),
    [localData.volume, localData.value, localData.rate]
  );

  const annualLeakage = useMemo(() =>
    calculateAnnualLeakage(monthlyLeakage),
    [monthlyLeakage]
  );

  const handleChange = (field: keyof CalculatorData, value: number) => {
    // If user clears the input (NaN), usually we might want to handle it gracefully, 
    // but RangeControl usually ensures a number. 
    // If it comes from the text input part of RangeControl, it might be partial.
    if (isNaN(value)) return;

    const newData = { ...localData, [field]: value };
    setLocalData(newData);

    // Validate single field
    try {
      CalculatorSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (e: any) {
      // Very basic Zod error extraction for single field
      if (e.errors && e.errors[0]) {
        setErrors(prev => ({ ...prev, [field]: e.errors[0].message }));
      }
    }

    // Optimistic update to parent
    onUpdate(newData);
  };

  const handleNext = () => {
    const result = CalculatorSchema.safeParse(localData);
    if (result.success) {
      onNext();
    } else {
      const fieldErrors: any = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          System Leakage <span className="text-blue-500">Calculator</span>
        </h1>
        <p className="text-slate-400 font-mono text-sm">
          PROTOCOL: IDENTIFY REVENUE ATTRITION VECTORS
        </p>
      </div>

      <BentoGrid>
        {/* INPUTS */}
        <BentoCard title="Parameters" className="col-span-12 md:col-span-5 flex flex-col justify-center space-y-8">
          <RangeControl
            label="Deal Volume / Mo"
            value={localData.volume}
            onChange={(val) => handleChange('volume', val)}
            min={1}
            max={500}
            step={1}
            prefix="#"
            error={errors.volume}
          />
          <RangeControl
            label="Avg Deal Value"
            value={localData.value}
            onChange={(val) => handleChange('value', val)}
            min={1000}
            max={50000}
            step={500}
            prefix="₱"
            error={errors.value}
          />
          <RangeControl
            label="Current Success Rate"
            value={localData.rate}
            onChange={(val) => handleChange('rate', val)}
            min={0}
            max={60}
            step={1}
            suffix="%"
            error={errors.rate}
          />
        </BentoCard>

        {/* METRICS DISPLAY */}
        <BentoCard title="Real-time Telemetry" className="col-span-12 md:col-span-7 bg-slate-900/80" accent="blue">
          <div className="grid grid-cols-2 gap-4 h-full content-center">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-slate-700 group-hover:text-blue-500 transition-colors">
                <Activity size={16} />
              </div>
              <div className="text-sm text-slate-400 font-bold font-mono mb-1">RAW REVENUE POTENTIAL</div>
              <div className="text-xl font-bold text-slate-200">
                {formatCurrency((localData.volume * localData.value) * 12)}
              </div>
              <div className="text-xs text-slate-500 mt-2 font-mono">ANNUAL RUN RATE</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-slate-700 group-hover:text-blue-500 transition-colors">
                <Layers size={16} />
              </div>
              <div className="text-sm text-slate-400 font-bold font-mono mb-1">ATTRITION FACTOR</div>
              <div className="text-xl font-bold text-slate-200">
                {100 - localData.rate}%
              </div>
              <div className="text-xs text-slate-500 mt-2 font-mono">SYSTEM INEFFICIENCY</div>
            </div>

            <div className="col-span-2 p-6 rounded-lg bg-slate-950/50 border border-slate-800/50 relative overflow-hidden group mt-2">
              <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
              <div className="absolute top-4 right-4 text-red-500 animate-pulse-slow">
                <TrendingDown size={24} />
              </div>
              <div className="relative z-10">
                <div className="text-sm text-red-400 font-bold font-mono mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  CRITICAL LEAKAGE DETECTED
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter tabular-nums">
                  {formatCurrency(annualLeakage)}
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  ANNUAL COMMISSION LEAKAGE (ESTIMATED @ 20% COMMISSION)
                </div>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* ACTIONS */}
        <div className="col-span-12 flex justify-end pt-4">
          <Button onClick={handleNext} className="w-full md:w-auto">
            INITIATE INGEST PROTOCOL <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </BentoGrid>
    </div>
  );
};