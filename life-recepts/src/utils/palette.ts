/**
 * Validated dark-mode palette (see dataviz skill: references/palette.md).
 * Categorical order passes CVD + normal-vision separation checks at
 * `--surface #12141c --mode dark`; do not reorder or cycle it.
 */
export const CATEGORICAL: string[] = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
];

export const SEQUENTIAL_BLUE = {
  100: "#184f95",
  200: "#256abf",
  300: "#3987e5",
  400: "#6da7ec",
  500: "#9ec5f4",
};

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export const INK = {
  surface: "#12141c",
  surfaceRaised: "#181a24",
  primary: "#ffffff",
  secondary: "#c3c2b7",
  muted: "#898781",
  grid: "#2c2c2a",
  baseline: "#383835",
  border: "rgba(255,255,255,0.10)",
};

export const INCOME_COLOR = "#199e70"; // aqua — same hue family as status "good"
export const EXPENSE_COLOR = "#e66767"; // red
export const NET_COLOR = "#3987e5"; // blue

/** Colour for the folded "everything else" bucket — deliberately not a series hue. */
export const MUTED_SERIES = "#5a5e6b";

/**
 * Builds category → colour once from the *unfiltered* dataset, so filtering
 * never repaints the surviving categories (colour follows the entity, not its
 * rank in the current view).
 */
export function buildCategoryColors(orderedCategories: string[]): Map<string, string> {
  const map = new Map<string, string>();
  orderedCategories.forEach((category, index) => {
    map.set(category, CATEGORICAL[index % CATEGORICAL.length]);
  });
  return map;
}
