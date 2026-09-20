import { CircleAlert, Receipt } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
        <Receipt size={24} strokeWidth={2.2} />
        <span className="absolute inset-0 animate-ping rounded-2xl bg-white opacity-20" />
      </div>
      <div>
        <p className="text-base font-medium text-[var(--ink-primary)]">Reading your receipts…</p>
        <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
          Parsing transaction history and building your dashboard.
        </p>
      </div>
      <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 rounded-full bg-white/70 [animation:loadbar_1.1s_ease-in-out_infinite]" />
      </div>
      <style>{`
        @keyframes loadbar {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  );
}

export function ErrorState({ message, detail }: { message: string; detail?: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d03b3b]/12 text-[#f0908f] ring-1 ring-inset ring-[#d03b3b]/25">
        <CircleAlert size={24} />
      </div>
      <p className="text-base font-medium text-[var(--ink-primary)]">{message}</p>
      {detail && <p className="max-w-md text-sm text-[var(--ink-secondary)]">{detail}</p>}
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        Check that the CSV files exist under <code className="text-zinc-400">public/data/</code> and reload.
      </p>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--hairline)] bg-white/[0.015] px-6 py-12 text-center">
      <p className="text-sm font-medium text-[var(--ink-secondary)]">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-[var(--ink-muted)]">{detail}</p>
    </div>
  );
}
