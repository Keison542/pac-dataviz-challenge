import { surfaceTempAnomalies } from "@/data/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/data/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/data/climate_drivers/sea_level_anomalies";
import { seaSurfaceTempAnomalies } from "@/data/climate_drivers/sea_surface_temp_anomalies";

export type ClimateRow = {
  year: number;
  temperature?: number;
  rainfall?: number;
  seaLevel?: number;
  seaSurfaceTemperature?: number;
};

export function buildMultiLineData() {
  const map = new Map<string, any>();

  const merge = (arr: any[], key: string) => {
    arr.forEach((d) => {
      const year = Number(d.year);
      const country = d.country ?? "GLOBAL";

      const id = `${country}-${year}`;

      if (!map.has(id)) {
        map.set(id, {
          year,
          country,
        });
      }

      map.get(id)[key] = Number(d.value ?? 0);
    });
  };

  merge(surfaceTempAnomalies, "temperature");
  merge(rainfallAnomalies, "rainfall");
  merge(seaLevelAnomalies, "seaLevel");
  merge(seaSurfaceTempAnomalies, "seaSurfaceTemperature");
  return Array.from(map.values()).sort(
    (a, b) => a.year - b.year
  );
}