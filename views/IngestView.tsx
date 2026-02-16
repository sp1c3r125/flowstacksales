import React, { useState } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Input, Button, Select } from '../components/UI';
import { IngestData, IngestSchema } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, User, Mail, Target, AlertTriangle } from 'lucide-react';

interface Props {
  data: IngestData;
  onUpdate: (data: IngestData) => void;
  onNext: () => void;
  onBack: () => void;
}

const NICHE_OPTIONS = [
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Solar', label: 'Solar' },
  { value: 'Medical', label: 'Medical (Clinic/Dentist)' },
  { value: 'Law Office', label: 'Law Office' },
  { value: 'Accounting', label: 'Accounting/Bookkeeping' },
  { value: 'Other', label: 'Other' },
];

const BOTTLENECK_OPTIONS = [
  { value: 'Slow response times', label: 'Slow response times' },
  { value: 'Manual data entry', label: 'Manual data entry' },
  { value: 'Lead follow-up', label: 'Lead follow-up' },
  { value: 'Ghosting', label: 'Ghosting' },
];

export const IngestView: React.FC<Props> = ({ data, onUpdate, onNext, onBack }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof IngestData, string>>>({});

  const handleChange = (field: keyof IngestData, value: string) => {
    onUpdate({ ...data, [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    const result = IngestSchema.safeParse(data);
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
          System Protocol <span className="text-emerald-500">Ingest</span>
        </h1>
        <p className="text-slate-400 font-mono text-sm">
          SECURITY CLEARANCE: EXECUTIVE LEVEL ONLY
        </p>
      </div>

      <BentoGrid className="max-w-3xl">
        <BentoCard title="Entity Identification" className="col-span-12" accent="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Agency Designation (Name)"
              value={data.agencyName}
              onChange={e => handleChange('agencyName', e.target.value)}
              error={errors.agencyName}
              placeholder="e.g. Apex Automation"
              prefix={<User size={14} />}
            />
            
            <Select 
              label="Sector Niche"
              value={data.niche}
              onChange={e => handleChange('niche', e.target.value)}
              error={errors.niche}
              options={NICHE_OPTIONS}
              prefix={<Target size={14} />}
            />

            <div className="md:col-span-2">
              <Input
                label="Secure Comms (Email)"
                type="email"
                value={data.contactEmail}
                onChange={e => handleChange('contactEmail', e.target.value)}
                error={errors.contactEmail}
                placeholder="executive@agency.com"
                prefix={<Mail size={14} />}
              />
            </div>

            <div className="md:col-span-2">
              <Select 
                label="What is your biggest bottleneck?"
                value={data.bottleneck}
                onChange={e => handleChange('bottleneck', e.target.value)}
                error={errors.bottleneck}
                options={BOTTLENECK_OPTIONS}
                prefix={<AlertTriangle size={14} />}
              />
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-emerald-400 font-mono text-sm font-bold mb-1">ZOD VALIDATION ACTIVE</h4>
              <p className="text-emerald-500/70 text-xs">
                All data points are securely schema-validated before entering the proposal engine. 
                Zero-trust architecture enforced.
              </p>
            </div>
          </div>
        </BentoCard>

        <div className="col-span-12 flex justify-between pt-4">
          <Button onClick={onBack} variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> RECALIBRATE
          </Button>
          <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-900/20">
            GENERATE PROPOSAL <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </BentoGrid>
    </div>
  );
};