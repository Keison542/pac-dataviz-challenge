import { surfaceTempAnomalies } from "@/climatedata/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/climatedata/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/climatedata/climate_drivers/sea_level_anomalies";
import { seaSurfaceTempAnomalies } from "@/climatedata/climate_drivers/sea_surface_temp_anomalies";

export type ClimateRow = {
  year: number;
  country: string;
  temperature?: number;
  rainfall?: number;
  seaLevel?: number;
  seaSurfaceTemperature?: number;
};

export function buildMultiLineData() {
  const map = new Map<string, ClimateRow>();

  const merge = <K extends keyof Omit<ClimateRow, "year" | "country">>(
    arr: any[],
    key: K,
  ) => {
    if (!Array.isArray(arr)) return;

    arr.forEach((d) => {
      if (!d) return; // ✅ prevent undefined entries

      const year = Number(d.year);
      const country = d.country ?? "GLOBAL";
      const value = Number(d.value);

      // ❌ skip invalid rows completely
      if (!Number.isFinite(year)) return;
      if (!Number.isFinite(value)) return;

      const id = `${country}-${year}`;

      if (!map.has(id)) {
        map.set(id, {
          year,
          country,
        });
      }

      const entry = map.get(id);
      if (!entry) return;

      entry[key] = value;
    });
  };

  merge(surfaceTempAnomalies, "temperature");
  merge(rainfallAnomalies, "rainfall");
  merge(seaLevelAnomalies, "seaLevel");
  merge(seaSurfaceTempAnomalies, "seaSurfaceTemperature");

  return Array.from(map.values())
    .filter((d): d is ClimateRow => Boolean(d && Number.isFinite(d.year)))
    .sort((a, b) => a.year - b.year);
}