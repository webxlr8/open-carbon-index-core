export type BadgeVariant = "card" | "compact" | "shield";
/** "auto" follows the host page's prefers-color-scheme. */
export type BadgeTheme = "light" | "dark" | "auto";
export type BadgeBackground = "solid" | "transparent";

export type BadgeStyle = {
  variant: BadgeVariant;
  theme: BadgeTheme;
  background: BadgeBackground;
  /** Shield left-side text. Sanitized + length-capped in params.ts. */
  label: string;
  showPercentile: boolean;
};

// "auto" is the default: an embedder shouldn't have to know or maintain
// which theme their page is in — the badge adapts on its own.
export const DEFAULT_STYLE: BadgeStyle = {
  variant: "card",
  theme: "auto",
  background: "solid",
  label: "carbon",
  showPercentile: true,
};

/** Attribution shown on the card and compact variants. */
export const ATTRIBUTION = "opencarbonindex.org · by WebXLR8";

// The grade IS the color — deliberately not customizable. A badge whose
// color could be overridden would let an F dress up as an A.
// Values mirror the --color-grade-* tokens in src/app/globals.css.
export const GRADE_COLORS: Record<string, string> = {
  "A+": "#0ae895",
  A: "#1cd868",
  B: "#4bc93b",
  C: "#9dbd16",
  D: "#d99d10",
  E: "#c04416",
  F: "#d42a2a",
};

// Which text colour is legible on each grade chip. The bright end needs
// dark text; only E and F carry white at WCAG AA. Mirrors GradePill.
//
// The dark value is deliberately NOT the badge's body ink (#1e212e): the
// theme=auto CSS recolours by matching fill attributes, so a chip sharing
// the body colour would get flipped to light-on-bright in dark mode and
// become unreadable. Distinct value, same visual weight.
const GRADE_ON_COLOR: Record<string, string> = {
  "A+": "#16181f",
  A: "#16181f",
  B: "#16181f",
  C: "#16181f",
  D: "#16181f",
  E: "#ffffff",
  F: "#ffffff",
};

/** Accessible text colour for a grade chip. */
export function gradeTextColor(grade: string | null): string {
  if (!grade) return "#ffffff";
  return GRADE_ON_COLOR[grade] ?? "#ffffff";
}

/** Used when a domain has no successful scan yet. */
export const UNKNOWN_COLOR = "#8c867b";

export function gradeColor(grade: string | null): string {
  if (!grade) return UNKNOWN_COLOR;
  return GRADE_COLORS[grade] ?? UNKNOWN_COLOR;
}

// Card and compact grew slightly to carry the attribution line without
// crowding. Shield is variable-width by nature.
export const BADGE_DIMENSIONS: Record<
  BadgeVariant,
  { width: number; height: number } | null
> = {
  card: { width: 260, height: 96 },
  compact: { width: 215, height: 58 },
  shield: null, // width depends on text; height fixed 20
};
