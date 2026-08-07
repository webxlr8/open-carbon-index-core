import { gradeColor, gradeTextColor } from "./styles";

// shields.io-style flat badge, hand-templated: ~1KB, no font files, fully
// deterministic — and trivially portable to an edge worker later. The
// viewer's own fonts render the <text>, so output never depends on Satori.

const FONT_STACK = "Verdana,Geneva,DejaVu Sans,sans-serif";
// Approximate Verdana 11px advance width. Generous padding absorbs the error.
const CHAR_W = 7.05;
const PAD = 10;

function textWidth(s: string): number {
  return Math.round(s.length * CHAR_W);
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export interface ShieldData {
  /** null → "not scanned yet" neutral badge */
  grade: string | null;
  co2Grams: number | null;
  label: string;
}

export function shieldValueText(
  grade: string | null,
  co2Grams: number | null,
): string {
  if (grade == null || co2Grams == null) return "not scanned yet";
  const co2 =
    co2Grams < 0.01
      ? `${(co2Grams * 1000).toFixed(2)} mg`
      : `${co2Grams.toFixed(2)} g`;
  return `${grade} · ${co2}/view`;
}

export function renderShieldSvg(data: ShieldData): string {
  const label = escapeXml(data.label);
  const value = escapeXml(shieldValueText(data.grade, data.co2Grams));
  const color = gradeColor(data.grade);
  const valueFg = gradeTextColor(data.grade);

  const lw = textWidth(data.label) + PAD * 2;
  const vw = textWidth(shieldValueText(data.grade, data.co2Grams)) + PAD * 2;
  const w = lw + vw;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">`,
    `<title>${label}: ${value}</title>`,
    `<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>`,
    `<g clip-path="url(#r)">`,
    `<rect width="${lw}" height="20" fill="#555"/>`,
    `<rect x="${lw}" width="${vw}" height="20" fill="${color}"/>`,
    `</g>`,
    `<g fill="#fff" text-anchor="middle" font-family="${FONT_STACK}" font-size="11">`,
    `<text x="${lw / 2}" y="14" fill="#010101" fill-opacity=".3">${label}</text>`,
    `<text x="${lw / 2}" y="13">${label}</text>`,
    `<text x="${lw + vw / 2}" y="13" fill="${valueFg}">${value}</text>`,
    `</g>`,
    `</svg>`,
  ].join("");
}
