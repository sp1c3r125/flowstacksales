import React, { useState } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Input, Button, Select } from '../components/UI';
import { IngestData, IngestSchema } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, User, Mail, Target, AlertTriangle, Phone, Building2, MessageSquare, Link2, Briefcase } from 'lucide-react';

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

const PACKAGE_INTEREST_OPTIONS = [
  { value: 'Not Sure', label: 'Not Sure' },
  { value: 'Lite', label: 'Lite' },
  { value: 'Starter', label: 'Starter' },
  { value: 'Growth', label: 'Growth' },
  { value: 'Scale', label: 'Scale' },
];

const YesNoPill: React.FC<{ label: string; value: boolean; onChange: (next: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-mono text-slate-400 uppercase tracking-wider font-bold">{label}</label>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onChange(true)} className={`rounded-lg border px-4 py-3 text-sm font-mono transition-all ${value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}>
        Yes
      </button>
      <button type="button" onClick={() => onChange(false)} className={`rounded-lg border px-4 py-3 text-sm font-mono transition-all ${!value ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}>
        No
      </button>
    </div>
  </div>
);

export const IngestView: React.FC<Props> = ({ data, onUpdate, onNext, onBack }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof IngestData, string>>>({});

  const handleChange = <K extends keyof IngestData>(field: K, value: IngestData[K]) => {
    onUpdate({ ...data, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleNext = () => {
    const result = IngestSchema.safeParse(data);
    if (result.success) onNext();
    else {
      const fieldErrors: Partial<Record<keyof IngestData, string>> = {};
      result.error.errors.forEach(err => {
        const key = err.path[0] as keyof IngestData | undefined;
        if (key) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Get your <span className="text-emerald-500">recommended package</span></h1>
        <p className="text-slate-400 text-base">
          Tell us how your sales process works today. We’ll use the details to recommend Lite, Starter, Growth, or Scale and push the qualification into ops.
        </p>
      </div>

      <BentoGrid className="max-w-6xl">
        <BentoCard title="Business and contact" className="col-span-12 md:col-span-7" accent="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Your name" value={data.contactName} onChange={e => handleChange('contactName', e.target.value)} error={errors.contactName} placeholder="e.g. Keanne Acar" prefix={<User size={14} />} />
            <Input label="Business name" value={data.agencyName} onChange={e => handleChange('agencyName', e.target.value)} error={errors.agencyName} placeholder="e.g. Apex Dental" prefix={<Building2 size={14} />} />
            <Input label="Best email" type="email" value={data.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} error={errors.contactEmail} placeholder="owner@business.com" prefix={<Mail size={14} />} />
            <Input label="Phone" value={data.phone} onChange={e => handleChange('phone', e.target.value)} error={errors.phone} placeholder="e.g. +63 917 000 0000" prefix={<Phone size={14} />} />
            <Select label="Business type" value={data.niche} onChange={e => handleChange('niche', e.target.value)} error={errors.niche} options={NICHE_OPTIONS} prefix={<Target size={14} />} />
            <Input label="Lead source" value={data.leadSource} onChange={e => handleChange('leadSource', e.target.value)} error={errors.leadSource} placeholder="e.g. Facebook, Instagram, Website" prefix={<MessageSquare size={14} />} />
            <Input label="Messages per day" type="number" value={String(data.messagesPerDay)} onChange={e => handleChange('messagesPerDay', Number(e.target.value || 0))} error={errors.messagesPerDay} placeholder="e.g. 12" prefix={<MessageSquare size={14} />} />
            <Select label="Package interest" value={data.packageInterest} onChange={e => handleChange('packageInterest', e.target.value)} error={errors.packageInterest} options={PACKAGE_INTEREST_OPTIONS} prefix={<Briefcase size={14} />} />
          </div>
        </BentoCard>

        <BentoCard title="Qualification signals" className="col-span-12 md:col-span-5">
          <div className="space-y-6">
            <Select label="Main bottleneck right now" value={data.bottleneck} onChange={e => handleChange('bottleneck', e.target.value)} error={errors.bottleneck} options={BOTTLENECK_OPTIONS} prefix={<AlertTriangle size={14} />} />
            <Input label="Current problem" value={data.currentProblem} onChange={e => handleChange('currentProblem', e.target.value)} error={errors.currentProblem} placeholder="e.g. We reply late and lose leads after hours." prefix={<AlertTriangle size={14} />} />
            <Input label="CRM used (optional)" value={data.crmUsed} onChange={e => handleChange('crmUsed', e.target.value)} error={errors.crmUsed} placeholder="e.g. HubSpot, GoHighLevel" prefix={<Briefcase size={14} />} />
            <Input label="Booking link (optional)" value={data.bookingLink} onChange={e => handleChange('bookingLink', e.target.value)} error={errors.bookingLink} placeholder="https://cal.com/..." prefix={<Link2 size={14} />} />
          </div>
        </BentoCard>

        <BentoCard title="Operational complexity" className="col-span-12 md:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <YesNoPill label="Needs booking" value={data.needsBooking} onChange={next => handleChange('needsBooking', next)} />
            <YesNoPill label="Multiple offers" value={data.multipleOffers} onChange={next => handleChange('multipleOffers', next)} />
            <YesNoPill label="Needs staff routing" value={data.needsStaffRouting} onChange={next => handleChange('needsStaffRouting', next)} />
          </div>
        </BentoCard>

        <BentoCard title="What happens next" className="col-span-12 md:col-span-4">
          <div className="space-y-4 text-sm text-slate-300">
            <div><span className="text-white font-semibold">1.</span> We recommend Lite, Starter, Growth, or Scale.</div>
            <div><span className="text-white font-semibold">2.</span> The website writes your qualification into Airtable fields for ops.</div>
            <div><span className="text-white font-semibold">3.</span> The proposal shows fit, pricing, scope limits, and next step.</div>
          </div>
          <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-emerald-400 font-mono text-sm font-bold mb-1">BOUNDED PACKAGE LOGIC</h4>
              <p className="text-emerald-500/70 text-xs">The system recommends approved packages only. It does not promise unlimited custom builds inside the standard offer.</p>
            </div>
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
