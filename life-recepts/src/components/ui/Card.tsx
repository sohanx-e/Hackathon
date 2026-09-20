import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  delay?: number;
}

/** The one card shell every dashboard section builds on. */
export default function Card({ children, className = "", title, subtitle, action, delay = 0 }: CardProps) {
  return (
    <section
      className={`animate-rise flex min-w-0 flex-col rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-5 sm:p-6 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--ink-primary)]">{title}</h2>
            )}
            {subtitle && <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small pill used in card headers to label a mode or highlight a figure. */
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  const styles =
    tone === "accent"
      ? "border-[#3987e5]/25 bg-[#3987e5]/10 text-[#7fb2f0]"
      : "border-[var(--hairline)] bg-white/[0.03] text-[var(--ink-muted)]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles}`}>
      {children}
    </span>
  );
}

/** Editorial overline that groups the dashboard into readable acts. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{children}</h2>
      <span className="h-px flex-1 bg-[var(--hairline)]" />
    </div>
  );
}
