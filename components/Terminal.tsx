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
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="w-full max-w-2xl bg-black border border-slate-800 rounded-lg shadow-2xl overflow-hidden font-mono text-sm relative">
                {/* Header */}
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <TerminalIcon size={14} />
                        <span className="text-xs font-bold uppercase">System Console - Uplink</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 animate-pulse" />
                    </div>
                </div>
                {/* Terminal Body */}
                <div className="p-6 h-80 overflow-y-auto text-green-500 space-y-2 font-bold tracking-tight bg-black/50 crt">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 animate-[slideIn_0.1s_ease-out]">
                            <span className="opacity-50 select-none">{(i + 1).toString().padStart(3, '0')}</span>
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
