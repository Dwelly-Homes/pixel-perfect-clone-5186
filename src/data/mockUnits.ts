/**
 * Mock unit generator for local testing.
 * Used as a fallback when GET /properties/:id/units returns empty or errors.
 * Remove this file (and its usages) once the backend unit endpoints are live.
 */

const UNIT_CONFIGS = [
  { unitType: "bedsitter",   monthlyRent: 8500,  label: "Bedsitter" },
  { unitType: "studio",      monthlyRent: 14000, label: "Studio" },
  { unitType: "1_bedroom",   monthlyRent: 22000, label: "1 Bedroom" },
  { unitType: "2_bedroom",   monthlyRent: 38000, label: "2 Bedroom" },
  { unitType: "3_bedroom",   monthlyRent: 55000, label: "3 Bedroom" },
];

// Stable pseudo-random from a string seed (no external deps)
function seededRand(seed: string, index: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  h = Math.imul(h ^ index, 0x9e3779b9) | 0;
  return Math.abs(h) / 2147483647;
}

export interface MockUnitRaw {
  _id: string;
  propertyId: string;
  unitNumber: string;
  floorNumber: number;
  unitType: string;
  monthlyRent: number;
  serviceCharge: number;
  status: "vacant" | "occupied";
  images: [];
  notes: string;
  createdAt: string;
}

/**
 * Generates `count` realistic mock units for a property.
 * Output shape matches the backend /units response.
 */
export function generateMockUnits(propertyId: string, count = 24): MockUnitRaw[] {
  const units: MockUnitRaw[] = [];
  const floorsNeeded = Math.ceil(count / 6);           // ~6 units per floor
  const configs = [...UNIT_CONFIGS];

  // Pick a primary unit type for this property (deterministic per property)
  const primaryIdx = Math.floor(seededRand(propertyId, 0) * configs.length);
  const primaryConfig = configs[primaryIdx];
  // Mix in a secondary type on some floors
  const secondaryIdx = (primaryIdx + 1) % configs.length;
  const secondaryConfig = configs[secondaryIdx];

  let unitSeq = 1;
  for (let floor = 1; floor <= floorsNeeded && units.length < count; floor++) {
    const unitsOnFloor = Math.min(6, count - units.length);
    for (let u = 1; u <= unitsOnFloor; u++) {
      const rand = seededRand(propertyId, unitSeq);
      const useSecondary = u > 4 && rand > 0.5;
      const cfg = useSecondary ? secondaryConfig : primaryConfig;

      // Slight price variation per unit (±10%)
      const variation = 1 + (seededRand(propertyId, unitSeq + 100) - 0.5) * 0.1;
      const rent = Math.round((cfg.monthlyRent * variation) / 500) * 500;

      // ~65 % vacant
      const status: "vacant" | "occupied" =
        seededRand(propertyId, unitSeq + 200) < 0.65 ? "vacant" : "occupied";

      units.push({
        _id: `mock-${propertyId}-${floor}${u.toString().padStart(2, "0")}`,
        propertyId,
        unitNumber: `${floor}${u.toString().padStart(2, "0")}`,
        floorNumber: floor,
        unitType: cfg.unitType,
        monthlyRent: rent,
        serviceCharge: 2000,
        status,
        images: [],
        notes: "",
        createdAt: new Date().toISOString(),
      });

      unitSeq++;
    }
  }

  return units;
}
