import React from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: string[];
  isOpen: boolean;
  onClose?: () => void;
  logsEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, isOpen, logsEndRef }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/88 p-4 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-300/24 bg-[#071224]/82 font-mono text-sm shadow-[0_0_0_1px_rgba(96,165,250,0.08),0_0_36px_rgba(37,99,235,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="flex items-center justify-between border-b border-blue-300/14 bg-[#04101f]/70 px-4 py-2">
          <div className="flex items-center gap-2 text-slate-300">
            <TerminalIcon size={14} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">System Console - Uplink</span>
          </div>
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20" />
            <div className="h-3 w-3 rounded-full border border-amber-500/50 bg-amber-500/20" />
            <div className="h-3 w-3 animate-pulse rounded-full border border-cyan-300/60 bg-cyan-300/20" />
          </div>
        </div>
        <div className="crt h-80 overflow-y-auto bg-[#020817]/80 p-6 font-bold tracking-tight text-cyan-300 space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 animate-[slideIn_0.1s_ease-out]">
              <span className="select-none opacity-50">{(i + 1).toString().padStart(3, '0')}</span>
              <span>{log}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
          <div className="animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
};
