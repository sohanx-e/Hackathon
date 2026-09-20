import type { SpotifyData, Txn } from "../types";
import { formatDuration } from "./formatting";

export type MomentKind = "income" | "expense" | "transfer" | "song";

/** One line in the unified life feed — a transaction or a song, whichever happened. */
export interface Moment {
  id: string;
  date: Date;
  time: string | null;
  kind: MomentKind;
  title: string;
  detail: string;
  amount: number | null;
}

const timeFormatter = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" });

/**
 * Weaves every transaction and every song play into one reverse-chronological
 * feed, so "what you bought" and "what you listened to" read as one story
 * instead of two unrelated dashboards.
 */
export function buildTimeline(txns: Txn[], spotify: SpotifyData, limit = 200): Moment[] {
  const moments: Moment[] = txns.map((t) => ({
    id: `txn-${t.id}`,
    date: t.date,
    time: t.time,
    kind: t.type,
    title: t.description,
    detail: t.category,
    amount: t.amount,
  }));

  if (spotify.kind === "plays") {
    for (const play of spotify.plays) {
      moments.push({
        id: `song-${play.ts.getTime()}-${play.track}`,
        date: play.ts,
        time: timeFormatter.format(play.ts),
        kind: "song",
        title: play.track,
        detail: `${play.artist} · ${formatDuration(play.msPlayed)}`,
        amount: null,
      });
    }
  }

  return moments.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
