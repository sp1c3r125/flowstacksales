import React from "react";

export function AmbientBlueBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#020817]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute -top-24 left-[-10%] h-[340px] w-[340px] rounded-full bg-blue-500/12 blur-[120px]" />
      <div className="absolute top-[18%] right-[-8%] h-[300px] w-[300px] rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[18%] h-[260px] w-[260px] rounded-full bg-indigo-500/10 blur-[110px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.08),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.06),transparent_30%)]" />
    </div>
  );
}

export function DotCluster({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute opacity-45 blur-[0.2px] ${className}`}
      style={{
        width: 220,
        height: 220,
        background:
          "radial-gradient(circle, rgba(96,165,250,0.95) 0 2px, transparent 3px)",
        backgroundSize: "18px 18px",
        maskImage:
          "radial-gradient(circle at center, black 20%, rgba(0,0,0,0.7) 45%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(circle at center, black 20%, rgba(0,0,0,0.7) 45%, transparent 75%)",
        filter: "drop-shadow(0 0 10px rgba(59,130,246,0.35))",
      }}
    />
  );
}

export function NeonPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-blue-400/20 bg-[#061126]/78 shadow-[0_0_0_1px_rgba(59,130,246,0.06),0_0_30px_rgba(37,99,235,0.10)] backdrop-blur-md ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(96,165,250,0.08),transparent_30%,transparent_70%,rgba(34,211,238,0.05))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-blue-400/30 bg-gradient-to-b from-blue-500/20 to-cyan-400/10 px-4 py-2 text-sm font-semibold text-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.18)] transition hover:border-cyan-300/50 hover:from-blue-400/25 hover:to-cyan-300/15 hover:shadow-[0_0_28px_rgba(34,211,238,0.22)]";

export const inputClass =
  "w-full rounded-xl border border-blue-400/18 bg-[#030b1d]/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_0_0_1px_rgba(37,99,235,0.03)] outline-none transition focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-400/20";

export default function FlowstackBlueAmbientThemeDemo() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <AmbientBlueBackground />
      <DotCluster className="right-[-40px] top-24" />
      <DotCluster className="bottom-10 left-[-30px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-cyan-300/70">
              Flowstack Sales OS
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
              Blue ambient website shell
            </h1>
          </div>

          <button className={primaryButtonClass}>Get package</button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <NeonPanel className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                Business and contact
              </p>
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-blue-100/80">
                Qualified intake
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Your name
                </label>
                <input className={inputClass} placeholder="e.g. Keanne Acar" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Business name
                </label>
                <input className={inputClass} placeholder="e.g. Apex Dental" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Best email
                </label>
                <input className={inputClass} placeholder="owner@business.com" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Phone
                </label>
                <input className={inputClass} placeholder="e.g. +63 917 000 0000" />
              </div>
            </div>
          </NeonPanel>

          <NeonPanel className="p-6">
            <p className="mb-6 text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Qualification signals
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Main problem right now
                </label>
                <select className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select an option...
                  </option>
                  <option>Missed calls</option>
                  <option>Slow lead follow-up</option>
                  <option>Revenue leakage</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Problem detail
                </label>
                <textarea
                  className={`${inputClass} min-h-[120px] resize-none`}
                  placeholder="Add context if needed"
                />
              </div>
            </div>
          </NeonPanel>
        </div>
      </div>
    </div>
  );
}
