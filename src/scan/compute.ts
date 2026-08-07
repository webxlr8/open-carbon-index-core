// SWDM v4 per-GB energy (kWh/GB)
const DC_OPERATIONAL = 0.055;
const NET_OPERATIONAL = 0.059;
const DEV_OPERATIONAL = 0.08;
const DC_EMBODIED = 0.012;
const NET_EMBODIED = 0.013;
const DEV_EMBODIED = 0.081;

// Per-segment kWh/GB so callers can apply different grid intensities
// to datacenter, network, and device emissions.
export const SEGMENT_KWH_PER_GB = {
  dc_operational: DC_OPERATIONAL,
  net_operational: NET_OPERATIONAL,
  dev_operational: DEV_OPERATIONAL,
  dc_embodied: DC_EMBODIED,
  net_embodied: NET_EMBODIED,
  dev_embodied: DEV_EMBODIED,
} as const;

export interface PerSegmentGridIntensity {
  dataCenter: number;
  network: number;
  device: number;
}

// Per-segment form (v4 with regional grid intensity).
// Use this when you have a real datacenter grid intensity — it's the most
// accurate form of SWDM v4 because it correctly applies the lower-carbon
// grid of the server's region to the datacenter share of emissions, while
// still using the global average (or your custom value) for network and device.
export function computeCo2Segmented(
  bytesGb: number,
  grid: PerSegmentGridIntensity,
  greenHosted = false,
): number {
  const dcKwh =
    DC_OPERATIONAL + DC_EMBODIED - (greenHosted ? DC_OPERATIONAL : 0);
  const netKwh = NET_OPERATIONAL + NET_EMBODIED;
  const devKwh = DEV_OPERATIONAL + DEV_EMBODIED;
  return (
    bytesGb *
    (dcKwh * grid.dataCenter + netKwh * grid.network + devKwh * grid.device)
  );
}
