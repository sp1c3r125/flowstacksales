import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BentoCard, BentoGrid } from '../components/BentoGrid';
import { Button, Input, Select } from '../components/UI';
import { IngestData } from '../types';

interface Props {
  data: IngestData;
  onUpdate: (data: IngestData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const IngestView: React.FC<Props> = ({ data, onUpdate, onNext, onBack }) => {
  const setField = <K extends keyof IngestData>(field: K, value: IngestData[K]) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-white md:text-4xl">Discovery intake</h1>
        <p className="mt-3 text-base text-slate-400">Demo mode accepts empty or partial inputs and always continues.</p>
      </div>

      <div className="mx-auto max-w-6xl">
        <BentoGrid className="max-w-6xl">
          <BentoCard title="Contact" className="col-span-12 md:col-span-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Your name" value={data.contactName || ''} onChange={(e) => setField('contactName', e.target.value)} />
              <Input label="Business name" value={data.agencyName || ''} onChange={(e) => setField('agencyName', e.target.value)} />
              <Input label="Email" value={data.contactEmail || ''} onChange={(e) => setField('contactEmail', e.target.value)} />
              <Input label="Phone" value={data.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
            </div>
          </BentoCard>

          <BentoCard title="Workflow" className="col-span-12 md:col-span-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Messages per day" value={String(data.messagesPerDay || '')} onChange={(e) => setField('messagesPerDay', Number(e.target.value || 0))} />
              <Input label="CRM used" value={data.crmUsed || ''} onChange={(e) => setField('crmUsed', e.target.value)} />
              <Select
                label="Response time"
                value={data.responseTime || 'within_15_minutes'}
                onChange={(e) => setField('responseTime', e.target.value)}
                options={[
                  { value: 'within_15_minutes', label: 'Within 15 minutes' },
                  { value: 'within_1_hour', label: 'Within 1 hour' },
                ]}
              />
              <Select
                label="Conversion action"
                value={data.conversionAction || 'book_call'}
                onChange={(e) => setField('conversionAction', e.target.value)}
                options={[
                  { value: 'book_call', label: 'Book call' },
                  { value: 'send_quote', label: 'Send quote' },
                ]}
              />
            </div>
          </BentoCard>
        </BentoGrid>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-800/60 pt-6 md:flex-row md:items-center md:justify-between">
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
