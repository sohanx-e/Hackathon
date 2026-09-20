export type TxnType = "income" | "expense" | "transfer";

/** A single normalised record, shared by every dataset the app can load. */
export interface Txn {
  id: string;
  date: Date;
  /** "HH:MM" when the source row carried a time, otherwise null. */
  time: string | null;
  description: string;
  category: string;
  subcategory: string | null;
  amount: number;
  type: TxnType;
  /** Payment mode / channel, when the source has one. */
  mode: string | null;
  /** City, state or similar location label, when the source has one. */
  place: string | null;
  /** Fraud / review flag, when the source has one. */
  flagged: boolean | null;
}

export interface DataQuality {
  totalRows: number;
  usable: number;
  duplicatesRemoved: number;
  skippedMissingAmount: number;
  skippedInvalidDate: number;
  parseErrors: number;
}

export type DatasetId = "household" | "card";

export interface Dataset {
  id: DatasetId;
  label: string;
  shortLabel: string;
  file: string;
  description: string;
  txns: Txn[];
  quality: DataQuality;
  currency: string;
  hasIncome: boolean;
  hasTransfers: boolean;
  hasFlags: boolean;
  hasModes: boolean;
  hasPlaces: boolean;
  hasTimes: boolean;
}

export interface Filters {
  type: TxnType | "all";
  categories: string[];
  from: Date | null;
  to: Date | null;
  search: string;
}

export interface CategoryTotal {
  category: string;
  amount: number;
  count: number;
  share: number;
}

export interface PeriodPoint {
  key: string;
  label: string;
  date: Date;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export type Granularity = "day" | "week" | "month" | "quarter" | "year";

export type InsightTone = "neutral" | "positive" | "warning";

export type InsightIcon =
  | "category"
  | "average"
  | "peak"
  | "largest"
  | "rhythm"
  | "savings"
  | "flag"
  | "merchant"
  | "cadence";

export interface Insight {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
  icon: InsightIcon;
}

export interface SpotifyField {
  field: string;
  description: string;
}

export interface SpotifyPlay {
  ts: Date;
  msPlayed: number;
  track: string;
  artist: string;
  album: string | null;
  platform: string | null;
  skipped: boolean | null;
  shuffle: boolean | null;
}

/**
 * spotify.csv can legitimately arrive in two shapes: a full streaming-history
 * export (one row per play) or the field dictionary Spotify ships alongside it.
 * The UI renders whichever it actually finds - and never invents the other.
 */
export type SpotifyData =
  | { kind: "plays"; plays: SpotifyPlay[]; rows: number; skippedRows: number }
  | { kind: "schema"; fields: SpotifyField[] }
  | { kind: "empty" };

export type LoadStatus = "idle" | "loading" | "ready" | "error";
