import { useMemo, useState, type ReactElement } from "react";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Music2 } from "lucide-react";
import Card from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { SpotifyData, Txn } from "../types";
import { buildTimeline, type Moment, type MomentKind } from "../utils/timeline";
import { formatCurrency, formatDate } from "../utils/formatting";

interface TimelineFeedProps {
  txns: Txn[];
  spotify: SpotifyData;
  delay?: number;
}

const PAGE_SIZE = 15;

const ICON: Record<MomentKind, ReactElement> = {
  income: <ArrowUpRight size={14} />,
  expense: <ArrowDownRight size={14} />,
  transfer: <ArrowLeftRight size={14} />,
  song: <Music2 size={14} />,
};

const TONE: Record<MomentKind, string> = {
  income: "text-[#5cd48a] bg-[#199e70]/10 border-[#199e70]/25",
  expense: "text-[#f2708a] bg-[#e23f66]/10 border-[#e23f66]/25",
  transfer: "text-[#7fb2f0] bg-[#3987e5]/10 border-[#3987e5]/25",
  song: "text-[#c48ef2] bg-[#8b3fe5]/10 border-[#8b3fe5]/25",
};

function narrate(m: Moment): string {
  switch (m.kind) {
    case "income":
      return `Received from ${m.title}`;
    case "expense":
      return `Spent at ${m.title}`;
    case "transfer":
      return `Transferred — ${m.title}`;
    case "song":
      return `Played "${m.title}"`;
  }
}

export default function TimelineFeed({ txns, spotify, delay = 0 }: TimelineFeedProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const moments = useMemo(() => buildTimeline(txns, spotify), [txns, spotify]);

  return (
    <Card
      title="Your story, moment by moment"
      subtitle="Every purchase and every song you played, woven into one timeline."
      delay={delay}
    >
      {moments.length === 0 ? (
        <EmptyState
          title="No moments yet"
          detail="Adjust the filters or widen the date range to see your timeline."
        />
      ) : (
        <>
          <ol className="space-y-1">
            {moments.slice(0, visible).map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${TONE[m.kind]}`}
                  aria-hidden
                >
                  {ICON[m.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-primary)]">{narrate(m)}</p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    {formatDate(m.date)}
                    {m.time ? ` · ${m.time}` : ""} · {m.detail}
                  </p>
                </div>
                {m.amount != null && (
                  <span className="shrink-0 text-sm font-medium text-[var(--ink-primary)]">
                    {formatCurrency(m.amount)}
                  </span>
                )}
              </li>
            ))}
          </ol>
          {visible < moments.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="mt-4 self-start text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:text-white"
            >
              Show more moments ({moments.length - visible} left)
            </button>
          )}
        </>
      )}
    </Card>
  );
}
