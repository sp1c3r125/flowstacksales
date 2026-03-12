import React, { useState, useMemo } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Button, RangeControl } from '../components/UI';
import { CalculatorData, CalculatorSchema } from '../types';
import { calculateMonthlyLeakage, calculateAnnualLeakage, formatCurrency } from '../utils/calculations';
import { ArrowRight, Activity, TrendingDown, Layers, CheckCircle2 } from 'lucide-react';
import { packageOrder, serviceCatalog, packageComparisonRows, recommendPackage } from '../services/catalog';

interface Props {
  data: CalculatorData;
  onUpdate: (data: CalculatorData) => void;
  onNext: () => void;
}

export const CalculatorView: React.FC<Props> = ({ data, onUpdate, onNext }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorData, string>>>({});
  const [localData, setLocalData] = useState<CalculatorData>(data);

  const monthlyLeakage = useMemo(() => calculateMonthlyLeakage(localData.volume, localData.value, localData.rate), [localData.volume, localData.value, localData.rate]);
  const annualLeakage = useMemo(() => calculateAnnualLeakage(monthlyLeakage), [monthlyLeakage]);
  const recommended = useMemo(() => serviceCatalog[recommendPackage(monthlyLeakage)], [monthlyLeakage]);

  const handleChange = (field: keyof CalculatorData, value: number) => {
    if (isNaN(value)) return;
    const newData = { ...localData, [field]: value };
    setLocalData(newData);

    try {
      CalculatorSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (e: any) {
      if (e.errors && e.errors[0]) setErrors(prev => ({ ...prev, [field]: e.errors[0].message }));
    }
    onUpdate(newData);
  };

  const handleNext = () => {
    const result = CalculatorSchema.safeParse(localData);
    if (result.success) onNext();
    else {
      const fieldErrors: any = {};
      result.error.errors.forEach(err => { if (err.path[0]) fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-mono uppercase tracking-wider mb-4">
          Package-qualified sales funnel
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Recover missed inquiries and <span className="text-blue-500">book more clients</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto">
          Flowstack installs approved automation systems for lead capture, follow-up, booking, routing, and reporting. Start by sizing the leak in your current process.
        </p>
      </div>

      <BentoGrid>
        <BentoCard title="Business inputs" className="col-span-12 md:col-span-5 flex flex-col justify-center space-y-8">
          <RangeControl label="Messages / leads per month" value={localData.volume} onChange={(val) => handleChange('volume', val)} min={1} max={500} step={1} prefix="#" error={errors.volume} />
          <RangeControl label="Average deal value" value={localData.value} onChange={(val) => handleChange('value', val)} min={1000} max={50000} step={500} prefix="₱" error={errors.value} />
          <RangeControl label="Current close or booking rate" value={localData.rate} onChange={(val) => handleChange('rate', val)} min={0} max={60} step={1} suffix="%" error={errors.rate} />
        </BentoCard>

        <BentoCard title="Revenue opportunity" className="col-span-12 md:col-span-7 bg-slate-900/80" accent="blue">
          <div className="grid grid-cols-2 gap-4 h-full content-center">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-slate-700 group-hover:text-blue-500 transition-colors"><Activity size={16} /></div>
              <div className="text-sm text-slate-400 font-bold font-mono mb-1">Annual revenue opportunity</div>
              <div className="text-xl font-bold text-slate-200">{formatCurrency((localData.volume * localData.value) * 12)}</div>
              <div className="text-xs text-slate-500 mt-2 font-mono">If your funnel was healthy</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-slate-700 group-hover:text-blue-500 transition-colors"><Layers size={16} /></div>
              <div className="text-sm text-slate-400 font-bold font-mono mb-1">Leakage factor</div>
              <div className="text-xl font-bold text-slate-200">{100 - localData.rate}%</div>
              <div className="text-xs text-slate-500 mt-2 font-mono">Uncaptured value</div>
            </div>

            <div className="col-span-2 p-6 rounded-lg bg-slate-950/50 border border-slate-800/50 relative overflow-hidden group mt-2">
              <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
              <div className="absolute top-4 right-4 text-red-500 animate-pulse-slow"><TrendingDown size={24} /></div>
              <div className="relative z-10">
                <div className="text-sm text-red-400 font-bold font-mono mb-2 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Estimated annual leakage</div>
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter tabular-nums">{formatCurrency(annualLeakage)}</div>
                <div className="text-xs text-slate-400 mt-2 font-mono">Used to recommend the right package, not oversell the biggest one</div>
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard title="Recommended package right now" className="col-span-12 md:col-span-4" accent="green">
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-white">{recommended.name}</div>
              <div className="text-sm text-emerald-400 mt-1">{recommended.tagline}</div>
            </div>
            <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-xs font-mono uppercase text-slate-500 mb-2">Pricing</div>
              <div className="text-white font-semibold">{recommended.setup}</div>
              <div className="text-slate-300">{recommended.monthly}</div>
              {recommended.altPricing && <div className="text-xs text-slate-500 mt-2">{recommended.altPricing}</div>}
            </div>
            <div className="space-y-2">
              {recommended.bestFor.map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />{item}</div>
              ))}
            </div>
          </div>
        </BentoCard>

        <BentoCard title="Package comparison" className="col-span-12 md:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="py-3 text-slate-500 font-mono uppercase text-xs">Category</th>
                  {packageOrder.map((key) => <th key={key} className="py-3 px-2 text-white">{serviceCatalog[key].name}</th>)}
                </tr>
              </thead>
              <tbody>
                {packageComparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-900">
                    <td className="py-3 text-slate-400">{row.label}</td>
                    {packageOrder.map((key) => <td key={key} className="py-3 px-2 text-slate-300">{row.values[key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>

        <div className="col-span-12 flex justify-end pt-4">
          <Button onClick={handleNext} className="w-full md:w-auto">
            Continue to recommendation <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </BentoGrid>
    </div>
  );
};
