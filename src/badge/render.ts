import { readFileSync } from "node:fs";
import satori from "satori";
import { assetPath } from "../paths";
import {
  ATTRIBUTION,
  BADGE_DIMENSIONS,
  type BadgeStyle,
  gradeColor,
  gradeTextColor,
} from "./styles";

let fontRegular: Buffer | null = null;
let fontBold: Buffer | null = null;

function loadFonts(): { regular: Buffer; bold: Buffer } {
  if (fontRegular && fontBold) return { regular: fontRegular, bold: fontBold };
  fontRegular = readFileSync(assetPath("fonts", "Inter-Regular.ttf"));
  fontBold = readFileSync(assetPath("fonts", "Inter-Bold.ttf"));
  return { regular: fontRegular, bold: fontBold };
}

export interface BadgeData {
  /** null → "not scanned yet" neutral badge */
  grade: string | null;
  co2Grams: number | null;
  percentile: number | null;
  domain: string;
  greenHosted: boolean;
}

function co2Text(co2Grams: number | null): string {
  if (co2Grams == null) return "not scanned yet";
  return co2Grams < 0.01
    ? `${(co2Grams * 1000).toFixed(2)}mg CO₂/view`
    : `${co2Grams.toFixed(2)}g CO₂/view`;
}

// Light and dark are exact mirrors so a single attribute-selector rule can
// swap one for the other at view time (see AUTO_THEME_CSS). Every value is
// distinct across the two sets, and distinct from every chip text colour
// in styles.ts — a shared value would get recoloured by the auto-theme
// rule and flip a chip to unreadable.
const LIGHT = {
  bg: "#f9fafd",
  fg: "#1e212e",
  sub: "#545765",
  border: "#dbdee6",
} as const;

const DARK = {
  bg: "#161822",
  fg: "#f2f3f7",
  sub: "#a3a7b5",
  border: "#2f3342",
} as const;

/**
 * CSS injected for theme=auto. A `fill`/`stroke` *property* overrides the
 * matching presentation attribute, so we can recolour Satori's static
 * output without re-rendering. Works inside <img> in current browsers;
 * anything that ignores it simply keeps the light rendering.
 */
const AUTO_THEME_CSS = `@media(prefers-color-scheme:dark){[fill="${LIGHT.bg}"]{fill:${DARK.bg}}[fill="${LIGHT.fg}"]{fill:${DARK.fg}}[fill="${LIGHT.sub}"]{fill:${DARK.sub}}[stroke="${LIGHT.border}"]{stroke:${DARK.border}}}`;

function palette(theme: BadgeStyle["theme"]) {
  // "auto" renders light, then adapts via CSS.
  return theme === "dark" ? DARK : LIGHT;
}

function chip(grade: string | null): object {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        background: gradeColor(grade),
        color: gradeTextColor(grade),
        borderRadius: 6,
        fontWeight: 700,
        fontSize: 18,
      },
      children: grade ?? "?",
    },
  };
}

function line(text: string, color: string, size: number, bold = false): object {
  return {
    type: "div",
    props: {
      style: { color, fontSize: size, ...(bold ? { fontWeight: 700 } : {}) },
      children: text,
    },
  };
}

function badgeElement(data: BadgeData, style: BadgeStyle): object {
  const p = palette(style.theme);
  const compact = style.variant === "compact";
  const lines: object[] = [
    line(co2Text(data.co2Grams), p.fg, compact ? 13 : 14, true),
  ];

  if (!compact) {
    lines.push(
      line(
        data.grade == null
          ? "scan it at the link"
          : data.greenHosted
            ? "green hosted"
            : "hosted",
        p.sub,
        11,
      ),
    );
    if (style.showPercentile && data.percentile != null && data.grade != null) {
      lines.push(
        line(`Cleaner than ${Math.round(data.percentile)}%`, p.sub, 11),
      );
    }
  }
  // Attribution is NOT added here on purpose. Satori converts every
  // character to glyph paths, and this one string cost ~9KB of path data —
  // indefensible on the artefact we promise is featherweight. It's injected
  // as a real <text> element after rendering instead (~200 bytes), the same
  // system-font approach the shield variant uses.

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        padding: compact ? "6px 10px" : "10px 14px",
        width: "100%",
        height: "100%",
        background: style.background === "transparent" ? "transparent" : p.bg,
        color: p.fg,
        border: `1px solid ${p.border}`,
        borderRadius: 8,
        fontFamily: "Inter",
        lineHeight: 1.25,
      },
      children: [
        chip(data.grade),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: lines,
          },
        },
      ],
    },
  };
}

// Rendered with the viewer's own fonts, so it costs bytes proportional to
// the string rather than to its glyph outlines.
const ATTRIBUTION_FONTS =
  "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

function attributionText(style: BadgeStyle, height: number) {
  const p = palette(style.theme);
  const x = style.variant === "compact" ? 10 : 14;
  return `<text x="${x}" y="${height - 9}" font-family="${ATTRIBUTION_FONTS}" font-size="9" fill="${p.sub}">${ATTRIBUTION}</text>`;
}

export async function renderBadgeSvg(
  data: BadgeData,
  style: BadgeStyle,
): Promise<string> {
  const fonts = loadFonts();
  const dims =
    BADGE_DIMENSIONS[style.variant === "compact" ? "compact" : "card"];
  const width = dims?.width ?? 260;
  const height = dims?.height ?? 96;

  let svg = await satori(badgeElement(data, style) as never, {
    width,
    height,
    fonts: [
      { name: "Inter", data: fonts.regular, weight: 400, style: "normal" },
      { name: "Inter", data: fonts.bold, weight: 700, style: "normal" },
    ],
  });

  // Injected rather than laid out by Satori — see the note in badgeElement.
  svg = svg.replace(/<\/svg>$/, `${attributionText(style, height)}</svg>`);

  if (style.theme === "auto") {
    svg = svg.replace(/^(<svg[^>]*>)/, `$1<style>${AUTO_THEME_CSS}</style>`);
  }
  return svg;
}
