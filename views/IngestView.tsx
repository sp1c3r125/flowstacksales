import React, { useEffect, useMemo, useState } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Input, Button, Select } from '../components/UI';
import { IngestData, IngestSchema } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User,
  Mail,
  Target,
  AlertTriangle,
  Phone,
  Building2,
  MessageSquare,
  Link2,
  Briefcase
} from 'lucide-react';

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

const LEAD_SOURCE_OPTIONS = [
  'Website',
  'Facebook',
  'Instagram',
  'WhatsApp',
  'SMS',
  'Calls',
  'Referral',
  'Walk-in',
  'Other',
];

const PRIMARY_PROBLEM_OPTIONS = [
  { value: 'Slow response times', label: 'Slow response times' },
  { value: 'Inconsistent lead follow-up', label: 'Inconsistent lead follow-up' },
  { value: 'Too many inquiries do not book', label: 'Too many inquiries do not book' },
  { value: 'Staff handoff is messy', label: 'Staff handoff is messy' },
  { value: 'No clear reporting or visibility', label: 'No clear reporting or visibility' },
  { value: 'Leads come from too many channels', label: 'Leads come from too many channels' },
  { value: 'Manual intake takes too much time', label: 'Manual intake takes too much time' },
  { value: 'No CRM or weak CRM process', label: 'No CRM or weak CRM process' },
  { value: 'Other', label: 'Other' },
];

const DRAFT_KEY = 'flowstack_ingest_draft_v3';
const PLACEHOLDER_KEY = 'flowstack_name_placeholder_v3';

const NAME_PLACEHOLDERS = [
  'e.g. Alex Morgan',
  'e.g. Jordan Reyes',
  'e.g. Taylor Cruz',
  'e.g. Sam Carter',
  'e.g. Casey Bennett',
  'e.g. Riley Santos',
  'e.g. Avery Collins',
  'e.g. Cameron Lee',
];

const pickSessionNamePlaceholder = () => {
  if (typeof window === 'undefined') return NAME_PLACEHOLDERS[0];
  const existing = window.sessionStorage.getItem(PLACEHOLDER_KEY);
  if (existing) return existing;
  const picked = NAME_PLACEHOLDERS[Math.floor(Math.random() * NAME_PLACEHOLDERS.length)];
  window.sessionStorage.setItem(PLACEHOLDER_KEY, picked);
  return picked;
};

const loadDraft = (): Partial<IngestData> => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    return {
      contactName: parsed.contactName || '',
      agencyName: parsed.agencyName || '',
      contactEmail: parsed.contactEmail || '',
      phone: parsed.phone || '',
      niche: parsed.niche || '',
      messagesPerDay: Number(parsed.messagesPerDay || 0),
      leadSources: Array.isArray(parsed.leadSources) ? parsed.leadSources : [],
      primaryProblem: parsed.primaryProblem || '',
      problemDetail: parsed.problemDetail || '',
      crmUsed: parsed.crmUsed || '',
      bookingLink: parsed.bookingLink || '',
      needsBooking: Boolean(parsed.needsBooking),
      multipleOffers: Boolean(parsed.multipleOffers),
      needsStaffRouting: Boolean(parsed.needsStaffRouting),
    };
  } catch {
    return {};
  }
};

const YesNoPill: React.FC<{ label: string; value: boolean; onChange: (next: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-mono text-slate-400 uppercase tracking-wider font-bold">{label}</label>
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-lg border px-4 py-3 text-sm font-mono transition-all ${value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-lg border px-4 py-3 text-sm font-mono transition-all ${!value ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}
      >
        No
      </button>
    </div>
  </div>
);

const MultiSelectPills: React.FC<{
  label: string;
  values: string[];
  options: string[];
  error?: string;
  onChange: (next: string[]) => void;
}> = ({ label, values, options, error, onChange }) => {
  const toggleOption = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter(v => v !== option));
      return;
    }
    onChange([...values, option]);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-slate-400 uppercase tracking-wider font-bold">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map(option => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`rounded-lg border px-4 py-3 text-sm font-mono transition-all ${active ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-red-400 text-xs font-mono">{error}</p> : null}
    </div>
  );
};

export const IngestView: React.FC<Props> = ({ data, onUpdate, onNext, onBack }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof IngestData, string>>>({});
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const namePlaceholder = useMemo(() => pickSessionNamePlaceholder(), []);

  useEffect(() => {
    const draft = loadDraft();
    if (!Object.keys(draft).length) return;
    onUpdate({ ...data, ...draft });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const draft = {
      contactName: data.contactName || '',
      agencyName: data.agencyName || '',
      contactEmail: data.contactEmail || '',
      phone: data.phone || '',
      niche: data.niche || '',
      messagesPerDay: Number(data.messagesPerDay || 0),
      leadSources: data.leadSources || [],
      primaryProblem: data.primaryProblem || '',
      problemDetail: data.problemDetail || '',
      crmUsed: data.crmUsed || '',
      bookingLink: data.bookingLink || '',
      needsBooking: data.needsBooking,
      multipleOffers: data.multipleOffers,
      needsStaffRouting: data.needsStaffRouting,
    };

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    data.contactName,
    data.agencyName,
    data.contactEmail,
    data.phone,
    data.niche,
    data.messagesPerDay,
    data.leadSources,
    data.primaryProblem,
    data.problemDetail,
    data.crmUsed,
    data.bookingLink,
    data.needsBooking,
    data.multipleOffers,
    data.needsStaffRouting,
  ]);

  const handleChange = <K extends keyof IngestData>(field: K, value: IngestData[K]) => {
    onUpdate({ ...data, [field]: value });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (submitNotice) {
      setSubmitNotice(null);
    }
  };

  const getMissingRequiredFields = (input: IngestData) => {
    const missing: string[] = [];

    if (!input.contactName?.trim()) missing.push('Your name');
    if (!input.agencyName?.trim()) missing.push('Business name');
    if (!input.contactEmail?.trim()) missing.push('Best email');
    if (!input.phone?.trim()) missing.push('Phone');
    if (!input.niche?.trim()) missing.push('Business type');
    if (!input.primaryProblem?.trim()) missing.push('Main problem right now');
    if (!Array.isArray(input.leadSources) || input.leadSources.length === 0) missing.push('Lead sources');
    if (!input.messagesPerDay || Number(input.messagesPerDay) <= 0) missing.push('Messages per day');

    return missing;
  };

  const handleNext = () => {
    const missingFields = getMissingRequiredFields(data);
    const result = IngestSchema.safeParse(data);

    if (result.success && missingFields.length === 0) {
      setSubmitNotice(null);
      onNext();
      return;
    }

    const fieldErrors: Partial<Record<keyof IngestData, string>> = {};

    if (!result.success) {
      result.error.errors.forEach(err => {
        const key = err.path[0] as keyof IngestData | undefined;
        if (key) fieldErrors[key] = err.message;
      });
    }

    if (!data.primaryProblem?.trim()) {
      fieldErrors.primaryProblem = fieldErrors.primaryProblem || 'Please select the main problem right now.';
    }

    if (!Array.isArray(data.leadSources) || data.leadSources.length === 0) {
      fieldErrors.leadSources = fieldErrors.leadSources || 'Please select at least one lead source.';
    }

    if (!data.messagesPerDay || Number(data.messagesPerDay) <= 0) {
      fieldErrors.messagesPerDay = fieldErrors.messagesPerDay || 'Please enter messages per day.';
    }

    setErrors(fieldErrors);

    if (missingFields.length > 0) {
      setSubmitNotice(`Please complete the required fields: ${missingFields.join(', ')}.`);
    } else {
      setSubmitNotice('Please review the highlighted required fields before continuing.');
    }

    const firstMissingSelector =
      !data.contactName?.trim() ? '#contactName' :
      !data.agencyName?.trim() ? '#agencyName' :
      !data.contactEmail?.trim() ? '#contactEmail' :
      !data.phone?.trim() ? '#phone' :
      !data.niche?.trim() ? '#niche' :
      !data.primaryProblem?.trim() ? '#primaryProblem' :
      (!Array.isArray(data.leadSources) || data.leadSources.length === 0) ? '[data-field="leadSources"]' :
      (!data.messagesPerDay || Number(data.messagesPerDay) <= 0) ? '#messagesPerDay' :
      null;

    if (firstMissingSelector) {
      setTimeout(() => {
        document.querySelector(firstMissingSelector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          Tell us about your <span className="text-emerald-500">lead flow</span>
        </h1>
        <p className="text-slate-400 text-base">
          We’ll use this to qualify the lead and recommend the right Flowstack package internally.
        </p>
      </div>

      <BentoGrid className="max-w-6xl">
        <BentoCard title="Business and contact" className="col-span-12 md:col-span-7" accent="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="contactName"
              name="contact_name"
              autoComplete="off"
              label="Your name"
              value={data.contactName}
              onChange={e => handleChange('contactName', e.target.value)}
              error={errors.contactName}
              placeholder={namePlaceholder}
              prefix={<User size={14} />}
            />
            <Input
              id="agencyName"
              name="organization"
              autoComplete="organization"
              label="Business name"
              value={data.agencyName}
              onChange={e => handleChange('agencyName', e.target.value)}
              error={errors.agencyName}
              placeholder="e.g. Apex Dental"
              prefix={<Building2 size={14} />}
            />
            <Input
              id="contactEmail"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              label="Best email"
              value={data.contactEmail}
              onChange={e => handleChange('contactEmail', e.target.value)}
              error={errors.contactEmail}
              placeholder="owner@business.com"
              prefix={<Mail size={14} />}
            />
            <Input
              id="phone"
              name="tel"
              type="tel"
              autoComplete="tel"
              label="Phone"
              value={data.phone}
              onChange={e => handleChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="e.g. +63 917 000 0000"
              prefix={<Phone size={14} />}
            />
            <Select
              id="niche"
              label="Business type"
              value={data.niche}
              onChange={e => handleChange('niche', e.target.value)}
              error={errors.niche}
              options={NICHE_OPTIONS}
              prefix={<Target size={14} />}
            />
            <Input
              id="messagesPerDay"
              label="Messages per day"
              type="number"
              value={String(data.messagesPerDay)}
              onChange={e => handleChange('messagesPerDay', Number(e.target.value || 0))}
              error={errors.messagesPerDay}
              placeholder="e.g. 12"
              prefix={<MessageSquare size={14} />}
            />
          </div>

          <div className="mt-6" data-field="leadSources">
            <MultiSelectPills
              label="Lead sources"
              values={data.leadSources}
              options={LEAD_SOURCE_OPTIONS}
              error={errors.leadSources}
              onChange={next => handleChange('leadSources', next)}
            />
          </div>
        </BentoCard>

        <BentoCard title="Qualification signals" className="col-span-12 md:col-span-5">
          <div className="space-y-6">
            <Select
              id="primaryProblem"
              label="Main problem right now"
              value={data.primaryProblem}
              onChange={e => handleChange('primaryProblem', e.target.value)}
              error={errors.primaryProblem}
              options={PRIMARY_PROBLEM_OPTIONS}
              prefix={<AlertTriangle size={14} />}
            />
            <Input
              label="Problem detail (optional)"
              value={data.problemDetail ?? ''}
              onChange={e => handleChange('problemDetail', e.target.value)}
              error={errors.problemDetail}
              placeholder="Add context if needed"
              prefix={<AlertTriangle size={14} />}
            />
            <Input
              label="CRM used (optional)"
              value={data.crmUsed}
              onChange={e => handleChange('crmUsed', e.target.value)}
              error={errors.crmUsed}
              placeholder="e.g. HubSpot, GoHighLevel"
              prefix={<Briefcase size={14} />}
            />
            <Input
              label="Booking link (optional)"
              value={data.bookingLink}
              onChange={e => handleChange('bookingLink', e.target.value)}
              error={errors.bookingLink}
              placeholder="https://cal.com/..."
              prefix={<Link2 size={14} />}
            />
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
            <div><span className="text-white font-semibold">1.</span> We qualify the lead based on the real intake details.</div>
            <div><span className="text-white font-semibold">2.</span> The website writes the qualification into Airtable for ops.</div>
            <div><span className="text-white font-semibold">3.</span> We recommend the right package internally after evaluating the workflow signals.</div>
          </div>
        </BentoCard>

        <BentoCard title="Data handling" className="col-span-12">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-emerald-400 font-mono text-sm font-bold mb-1">BOUNDED PACKAGE LOGIC</h4>
              <p className="text-emerald-500/70 text-xs">
                The system recommends approved packages internally. The form collects qualification data, not package guesses from the lead.
              </p>
            </div>
          </div>
        </BentoCard>

        {submitNotice ? (
          <div className="col-span-12 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {submitNotice}
          </div>
        ) : null}

        <div className="col-span-12 flex justify-between pt-4">
          <Button onClick={onBack} variant="secondary"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-900/20">
            Generate recommendation <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </BentoGrid>
    </div>
  );
};
