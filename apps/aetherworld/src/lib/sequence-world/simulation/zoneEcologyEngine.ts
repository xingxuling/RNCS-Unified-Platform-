// Zone Ecology Engine — 区域生态
export interface SimulatedZone {
  zoneId: string;
  name: string;
  zoneType: string;
  stability: number;
  eventPressure: number;
  resourceDensity: number;
  npcDensity: number;
  hiddenLayer: number;
  dominantDigits: string[];
  activeEvents: string[];
  availableResources: string[];
  connectedZones: string[];
}

export function applyDigitBias(zone: SimulatedZone): SimulatedZone {
  let { stability, eventPressure, resourceDensity, npcDensity, hiddenLayer } = zone;
  const has = (d: string) => zone.dominantDigits.includes(d);
  if (has("0")) { stability += 0.1; eventPressure -= 0.2; }
  if (has("2")) { npcDensity += 0.2; }
  if (has("4")) { stability += 0.15; }
  if (has("5")) { eventPressure += 0.25; }
  if (has("6")) { stability += 0.2; }
  if (has("7")) { hiddenLayer += 0.2; }
  if (has("8")) { resourceDensity += 0.25; }
  if (has("9")) { eventPressure += 0.15; }
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return { ...zone, stability: clamp(stability), eventPressure: clamp(eventPressure),
    resourceDensity: clamp(resourceDensity), npcDensity: clamp(npcDensity), hiddenLayer: clamp(hiddenLayer) };
}

export function buildDefaultZones(dominantDigits: string[]): SimulatedZone[] {
  const seeds = [
    { zoneId: "z-core",      name: "核心区",   zoneType: "CORE",     digits: dominantDigits.slice(0, 2) },
    { zoneId: "z-frontier",  name: "边境区",   zoneType: "FRONTIER", digits: ["5", "7"] },
    { zoneId: "z-archive",   name: "归档区",   zoneType: "ARCHIVE",  digits: ["0", "8"] },
  ];
  return seeds.map(s => applyDigitBias({
    zoneId: s.zoneId, name: s.name, zoneType: s.zoneType,
    stability: 0.5, eventPressure: 0.3, resourceDensity: 0.4, npcDensity: 0.4, hiddenLayer: 0.2,
    dominantDigits: s.digits, activeEvents: [], availableResources: [], connectedZones: [],
  }));
}
