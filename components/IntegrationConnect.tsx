import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Button, Input } from './UI';

interface IntegrationConnectProps {
  onStored: (payload: { saved: boolean; configured: string[] }) => void;
}

export const IntegrationConnect: React.FC<IntegrationConnectProps> = ({ onStored }) => {
  const [airtableKey, setAirtableKey] = useState('');
  const [gmailKey, setGmailKey] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/secrets/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'demo-client',
          airtable_api_key: airtableKey,
          gmail_api_key: gmailKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to store secrets');
      }

      setStatus('Integrations stored securely.');
      onStored({
        saved: true,
        configured: Array.isArray(data?.configured) ? data.configured : Array.isArray(data?.data?.configured) ? data.data.configured : ['Airtable', 'Gmail'],
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to store secrets');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-500/18 bg-[linear-gradient(145deg,rgba(7,20,39,0.96),rgba(4,13,34,0.98)_45%,rgba(3,11,29,0.99))] p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 p-3">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-300/75">Connect integrations</div>
          <h2 className="mt-2 text-2xl font-bold text-white">Store credentials securely</h2>
          <p className="mt-2 text-sm text-slate-400">Keys are encrypted before persistence. They are never shown back in plaintext.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          type="password"
          label="Airtable API key"
          value={airtableKey}
          onChange={(event) => setAirtableKey(event.target.value)}
          placeholder="pat..."
          prefix={<KeyRound size={14} />}
        />
        <Input
          type="password"
          label="Gmail API key"
          value={gmailKey}
          onChange={(event) => setGmailKey(event.target.value)}
          placeholder="AIza..."
          prefix={<KeyRound size={14} />}
        />
      </div>

      {status ? <div className="mt-4 text-sm text-slate-300">{status}</div> : null}

      <div className="mt-6">
        <Button onClick={submit} isLoading={isLoading} disabled={!airtableKey && !gmailKey}>
          Save integration secrets
        </Button>
      </div>
    </div>
  );
};
