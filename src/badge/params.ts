import { z } from "zod";
import { type BadgeStyle, DEFAULT_STYLE } from "./styles";

// Badge identity lives entirely in the URL: same params → same bytes.
// No DB writes, no session state — this is what makes the serving path
// infinitely CDN-cacheable.
const badgeParamsSchema = z.object({
  variant: z.enum(["card", "compact", "shield"]).catch(DEFAULT_STYLE.variant),
  theme: z.enum(["light", "dark", "auto"]).catch(DEFAULT_STYLE.theme),
  bg: z.enum(["solid", "transparent"]).catch(DEFAULT_STYLE.background),
  // Rendered inside SVG <text>: allow word chars + light punctuation only,
  // hard length cap. Anything else falls back to the default label.
  label: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[\w .,:+&'-]+$/)
    .catch(DEFAULT_STYLE.label),
  percentile: z.enum(["0", "1"]).catch("1"),
});

export function parseBadgeParams(searchParams: URLSearchParams): BadgeStyle {
  const parsed = badgeParamsSchema.parse({
    variant: searchParams.get("variant") ?? undefined,
    theme: searchParams.get("theme") ?? undefined,
    bg: searchParams.get("bg") ?? undefined,
    label: searchParams.get("label") ?? undefined,
    percentile: searchParams.get("percentile") ?? undefined,
  });
  return {
    variant: parsed.variant,
    theme: parsed.theme,
    background: parsed.bg,
    label: parsed.label,
    showPercentile: parsed.percentile === "1",
  };
}

/**
 * Stable cache-key fragment for ETags: must be unique per style
 * permutation, or two different-looking badges collide in the CDN.
 */
export function styleKey(style: BadgeStyle): string {
  return [
    style.variant,
    style.theme,
    style.background,
    style.showPercentile ? "1" : "0",
    encodeURIComponent(style.label),
  ].join("-");
}
