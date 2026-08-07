import { Resvg } from "@resvg/resvg-js";

export function svgToPng(svg: string, scale = 2): Buffer {
  const resvg = new Resvg(svg, {
    // zoom multiplies the SVG's intrinsic size, so every variant
    // (card 240w, compact 190w, shield variable-w) scales correctly.
    fitTo: { mode: "zoom", value: scale },
  });
  return Buffer.from(resvg.render().asPng());
}
