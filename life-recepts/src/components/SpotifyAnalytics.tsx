import { useMemo, type ReactNode } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Disc3, Headphones, ListMusic, Music } from "lucide-react";
import Card, { Chip } from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { SpotifyData } from "../types";
import { formatDuration, formatNumber, formatPercent, truncate } from "../utils/formatting";
import { CATEGORICAL, INK } from "../utils/palette";

interface SpotifyAnalyticsProps {
  data: SpotifyData;
  delay?: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SpotifyAnalytics({ data, delay }: SpotifyAnalyticsProps) {
  const stats = useMemo(() => {
    if (data.kind !== "plays") return null;

    const totalMs = data.plays.reduce((s, p) => s + p.msPlayed, 0);
    const artistMs = new Map<string, number>();
    const trackMs = new Map<string, { artist: string; ms: number }>();
    const dayMs = new Array(7).fill(0) as number[];
    let skipped = 0;
    let skipTracked = 0;

    for (const p of data.plays) {
      artistMs.set(p.artist, (artistMs.get(p.artist) ?? 0) + p.msPlayed);
      const trackKey = `${p.track} — ${p.artist}`;
      const existing = trackMs.get(trackKey);
      trackMs.set(trackKey, { artist: p.artist, ms: (existing?.ms ?? 0) + p.msPlayed });
      dayMs[p.ts.getDay()] += p.msPlayed;
      if (p.skipped !== null) {
        skipTracked += 1;
        if (p.skipped) skipped += 1;
      }
    }

    const topArtists = [...artistMs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([artist, ms], i) => ({ artist, ms, color: CATEGORICAL[i % CATEGORICAL.length] }));

    const topTracks = [...trackMs.entries()]
      .sort((a, b) => b[1].ms - a[1].ms)
      .slice(0, 5)
      .map(([label, v]) => ({ label, ms: v.ms }));

    const peakDayIndex = dayMs.indexOf(Math.max(...dayMs));

    return {
      totalMs,
      uniqueArtists: artistMs.size,
      uniqueTracks: trackMs.size,
      topArtists,
      topTracks,
      peakDay: DAY_NAMES[peakDayIndex],
      skipRate: skipTracked > 0 ? (skipped / skipTracked) * 100 : null,
      plays: data.plays.length,
    };
  }, [data]);

  if (data.kind === "empty") {
    return (
      <Card title="Music life" subtitle="What your listening history reveals" delay={delay}>
        <EmptyState
          title="No Spotify listening data available"
          detail="spotify.csv doesn't contain any readable listening records, so this section stays empty rather than showing fabricated numbers."
        />
      </Card>
    );
  }

  // The file currently ships Spotify's field dictionary rather than play rows.
  // Rather than an empty void, show exactly what was found and what's ready.
  if (data.kind === "schema") {
    return (
      <Card
        title="Music life"
        subtitle="Waiting on your streaming history export"
        delay={delay}
        action={<Chip>Schema only</Chip>}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300 ring-1 ring-inset ring-white/10">
              <Music size={18} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-secondary)]">
              <span className="font-medium text-[var(--ink-primary)]">spotify.csv</span> currently holds{" "}
              {data.fields.length} field definitions — the data dictionary Spotify ships alongside an export, not
              the play history itself.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              Drop a real streaming-history export with these same columns into{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[12px] text-zinc-300">public/data/</code>{" "}
              and this section fills in automatically — listening time, top artists and tracks, unique counts,
              most active day and skip rate.
            </p>
          </div>

          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Columns detected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.fields.map((field) => (
                <span
                  key={field.field}
                  title={field.description}
                  className="cursor-default rounded-lg border border-[var(--hairline)] bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-[var(--ink-secondary)] transition-colors hover:border-[var(--hairline-strong)] hover:text-white"
                >
                  {field.field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card
      title="Music life"
      subtitle={`${formatNumber(stats.plays)} listening records analyzed`}
      delay={delay}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniStat icon={<Headphones size={16} />} label="Listening time" value={formatDuration(stats.totalMs)} />
        <MiniStat icon={<Music size={16} />} label="Unique tracks" value={formatNumber(stats.uniqueTracks)} />
        <MiniStat icon={<Disc3 size={16} />} label="Unique artists" value={formatNumber(stats.uniqueArtists)} />
        <MiniStat icon={<ListMusic size={16} />} label="Most active day" value={stats.peakDay} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-zinc-300">Top artists</p>
          <div style={{ height: Math.max(180, stats.topArtists.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topArtists} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="artist"
                  width={100}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: INK.secondary, fontSize: 12 }}
                  tickFormatter={(v: string) => truncate(v, 14)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as { artist: string; ms: number };
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#181a24] px-3 py-2 text-xs shadow-xl">
                        <p className="font-medium text-white">{row.artist}</p>
                        <p className="text-zinc-400">{formatDuration(row.ms)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="ms" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {stats.topArtists.map((row) => (
                    <Cell key={row.artist} fill={row.color} />
                  ))}
                  <LabelList
                    dataKey="ms"
                    position="right"
                    fill={INK.secondary}
                    fontSize={11}
                    formatter={(v) => formatDuration(Number(v))}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-zinc-300">Top tracks</p>
          <ul className="divide-y divide-white/5">
            {stats.topTracks.map((t, i) => (
              <li key={t.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="text-xs font-medium text-zinc-600">{i + 1}</span>
                  <span className="truncate text-sm text-zinc-200">{truncate(t.label, 40)}</span>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">{formatDuration(t.ms)}</span>
              </li>
            ))}
          </ul>
          {stats.skipRate !== null && (
            <p className="mt-4 text-xs text-zinc-500">
              Skip rate: <span className="text-zinc-300">{formatPercent(stats.skipRate)}</span> of tracked plays
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-zinc-200">{icon}</div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
