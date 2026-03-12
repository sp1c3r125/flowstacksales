import React, { useState } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Input, Button, Select } from '../components/UI';
import { IngestData, IngestSchema } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, User, Mail, Target, AlertTriangle, ClipboardList, CircleOff, CalendarRange } from 'lucide-react';
import { faqItems, onboardingChecklist, rolloutSteps } from '../services/catalog';

interface Props {
  data: IngestData;
  onUpdate: (data: IngestData) => void;
  onNext: () => void;
  onBack: () => void;
}

const NICHE_OPTIONS = [
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Hospitality', label: 'Hospitality / Tourism' },
  { value: 'Medical', label: 'Clinic / Dental / Medical' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Gym / Fitness', label: 'Gym / Fitness' },
  { value: 'Other', label: 'Other' },
];

const BOTTLENECK_OPTIONS = [
  { value: 'Slow response times', label: 'Slow response times' },
  { value: 'Lead follow-up', label: 'Lead follow-up is inconsistent' },
  { value: 'Booking conversion', label: 'Too many inquiries do not book' },
  { value: 'Missed handoff', label: 'Staff handoff is messy' },
  { value: 'Reporting visibility', label: 'No clear visibility or reporting' },
];

export const IngestView: React.FC<Props> = ({ data, onUpdate, onNext, onBack }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof IngestData, string>>>({});

  const handleChange = (field: keyof IngestData, value: string) => {
    onUpdate({ ...data, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleNext = () => {
    const result = IngestSchema.safeParse(data);
    if (result.success) onNext();
    else {
      const fieldErrors: any = {};
      result.error.errors.forEach(err => { if (err.path[0]) fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Get your <span className="text-emerald-500">recommended package</span></h1>
        <p className="text-slate-400 text-base">
          Tell us what kind of business you run and where your current process breaks. We’ll turn that into a bounded recommendation, not a vague AI pitch.
        </p>
      </div>

      <BentoGrid className="max-w-6xl">
        <BentoCard title="Qualification inputs" className="col-span-12 md:col-span-7" accent="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Business name" value={data.agencyName} onChange={e => handleChange('agencyName', e.target.value)} error={errors.agencyName} placeholder="e.g. Apex Dental" prefix={<User size={14} />} />
            <Select label="Business type" value={data.niche} onChange={e => handleChange('niche', e.target.value)} error={errors.niche} options={NICHE_OPTIONS} prefix={<Target size={14} />} />
            <div className="md:col-span-2">
              <Input label="Best email for proposal and next step" type="email" value={data.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} error={errors.contactEmail} placeholder="owner@business.com" prefix={<Mail size={14} />} />
            </div>
            <div className="md:col-span-2">
              <Select label="Main bottleneck right now" value={data.bottleneck} onChange={e => handleChange('bottleneck', e.target.value)} error={errors.bottleneck} options={BOTTLENECK_OPTIONS} prefix={<AlertTriangle size={14} />} />
            </div>
          </div>
        </BentoCard>

        <BentoCard title="What happens next" className="col-span-12 md:col-span-5">
          <div className="space-y-4 text-sm text-slate-300">
            {rolloutSteps.map((step, index) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center justify-center shrink-0">{index + 1}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-emerald-400 font-mono text-sm font-bold mb-1">BOUNDED PACKAGE LOGIC</h4>
              <p className="text-emerald-500/70 text-xs">The system recommends approved packages only. It does not promise unlimited custom builds inside the standard offer.</p>
            </div>
          </div>
        </BentoCard>

        <BentoCard title="What to prepare before setup" className="col-span-12 md:col-span-7" accent="blue">
          <div className="grid md:grid-cols-2 gap-3">
            {onboardingChecklist.map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300 flex gap-3 items-start">
                <ClipboardList size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard title="Not for everyone" className="col-span-12 md:col-span-5">
          <div className="space-y-3 text-sm text-slate-300">
            {[
              'Businesses with almost no inquiries and no clear follow-up need.',
              'Teams expecting unlimited custom automation inside starter pricing.',
              'Enterprise-grade workflow builds that need separate custom scoping.'
            ].map((item) => (
              <div key={item} className="flex gap-3 items-start rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <CircleOff size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard title="Fast answers" className="col-span-12">
          <div className="grid md:grid-cols-2 gap-4">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                <div className="text-white font-semibold flex items-center gap-2"><CalendarRange size={16} className="text-slate-500" />{item.question}</div>
                <div className="text-sm text-slate-400">{item.answer}</div>
              </div>
            ))}
          </div>
        </BentoCard>

        <div className="col-span-12 flex justify-between pt-4">
          <Button onClick={onBack} variant="secondary"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-900/20">Generate recommendation <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </BentoGrid>
    </div>
  );
};
