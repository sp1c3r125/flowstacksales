import React from "react";

export function AmbientBlueBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#020817]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.30),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.22),transparent_20%),radial-gradient(circle_at_30%_85%,rgba(99,102,241,0.20),transparent_22%),radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.16),transparent_18%)]" />

      <div className="absolute -top-24 left-[-8%] h-[420px] w-[420px] rounded-full bg-blue-500/22 blur-[130px]" />
      <div className="absolute top-[10%] right-[-6%] h-[380px] w-[380px] rounded-full bg-cyan-400/18 blur-[130px]" />
      <div className="absolute bottom-[-12%] left-[12%] h-[340px] w-[340px] rounded-full bg-indigo-500/16 blur-[120px]" />
      <div className="absolute bottom-[8%] right-[10%] h-[280px] w-[280px] rounded-full bg-sky-400/12 blur-[100px]" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(96,165,250,0.05))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_34%)]" />
    </div>
  );
}

export function DotCluster({
  className = "",
  size = 260,
  opacity = 0.85,
}: {
  className?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
        background:
          "radial-gradient(circle, rgba(147,197,253,1) 0 2.4px, transparent 3.4px)",
        backgroundSize: "18px 18px",
        maskImage:
          "radial-gradient(circle at center, black 22%, rgba(0,0,0,0.82) 48%, transparent 76%)",
        WebkitMaskImage:
          "radial-gradient(circle at center, black 22%, rgba(0,0,0,0.82) 48%, transparent 76%)",
        filter:
          "drop-shadow(0 0 10px rgba(96,165,250,0.55)) drop-shadow(0 0 24px rgba(59,130,246,0.35))",
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
      className={`relative overflow-hidden rounded-2xl border border-blue-300/28 bg-[#071224]/72 shadow-[0_0_0_1px_rgba(96,165,250,0.10),0_0_30px_rgba(37,99,235,0.16),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(96,165,250,0.11),transparent_24%,transparent_74%,rgba(34,211,238,0.08))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blue-300/30 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-cyan-300/40 bg-gradient-to-b from-blue-500/30 to-cyan-400/16 px-4 py-2 text-sm font-semibold text-blue-50 shadow-[0_0_24px_rgba(59,130,246,0.25)] transition hover:border-cyan-200/70 hover:from-blue-400/40 hover:to-cyan-300/22 hover:shadow-[0_0_36px_rgba(34,211,238,0.30)]";

export const inputClass =
  "w-full rounded-xl border border-blue-300/22 bg-[#04101f]/88 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(37,99,235,0.06)] outline-none transition focus:border-cyan-300/65 focus:ring-2 focus:ring-cyan-400/24";
