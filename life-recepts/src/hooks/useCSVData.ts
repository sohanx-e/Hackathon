import { useEffect, useState } from "react";
import type { Dataset, DatasetId, LoadStatus, SpotifyData } from "../types";
import { CsvLoadError, loadCsv, normalizeCard, normalizeHousehold, normalizeSpotify } from "../utils/csv";

interface DatasetConfig {
  id: DatasetId;
  label: string;
  shortLabel: string;
  file: string;
  description: string;
}

const DATASET_CONFIG: DatasetConfig[] = [
  {
    id: "household",
    label: "Household ledger",
    shortLabel: "Household",
    file: "/data/household.csv",
    description: "Personal income, expenses and transfers.",
  },
  {
    id: "card",
    label: "Card transactions",
    shortLabel: "Card",
    file: "/data/transactions.csv",
    description: "Card-spend export across merchants and categories.",
  },
];

export interface CSVDataState {
  status: LoadStatus;
  error: string | null;
  datasets: Dataset[];
  spotify: SpotifyData;
}

const initialState: CSVDataState = {
  status: "loading",
  error: null,
  datasets: [],
  spotify: { kind: "empty" },
};

/**
 * Loads and normalises every CSV the dashboard needs, once, on mount.
 * A failure in one file never blocks the others - each dataset degrades to
 * "not available" independently rather than taking the whole app down.
 */
export function useCSVData(): CSVDataState {
  const [state, setState] = useState<CSVDataState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const datasets: Dataset[] = [];
      const failures: string[] = [];

      for (const config of DATASET_CONFIG) {
        try {
          const { rows, parseErrors } = await loadCsv(config.file);
          const core = config.id === "household"
            ? normalizeHousehold(rows, parseErrors)
            : normalizeCard(rows, parseErrors);
          if (core.txns.length > 0) {
            datasets.push({ ...config, ...core });
          } else if (rows.length > 0) {
            failures.push(`${config.label}: no usable rows after validation`);
          }
        } catch (err) {
          const message = err instanceof CsvLoadError ? err.message : "Failed to load file";
          failures.push(`${config.label}: ${message}`);
        }
      }

      let spotify: SpotifyData;
      try {
        const { rows } = await loadCsv("/data/spotify.csv");
        spotify = normalizeSpotify(rows);
      } catch {
        spotify = { kind: "empty" };
      }

      if (cancelled) return;

      if (datasets.length === 0) {
        setState({
          status: "error",
          error: failures.length ? failures.join(" · ") : "No data could be loaded.",
          datasets: [],
          spotify,
        });
        return;
      }

      setState({ status: "ready", error: failures.length ? failures.join(" · ") : null, datasets, spotify });
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
