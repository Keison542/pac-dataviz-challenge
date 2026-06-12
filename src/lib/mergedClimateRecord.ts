// src/lib/mergedClimateRecord.ts

import { surfaceTempAnomalies } from "@/data/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/data/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/data/climate_drivers/sea_level_anomalies";
import { disasterEconomicLoss } from "@/data/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/data/human_consequence/number_of_persons_affected";
import { seaSurfaceTempAnomalies } from "@/data/climate_drivers/sea_surface_temp_anomalies";
import { tourist_arrival } from "@/data/economic_consequence/tourist_arrival";
import { climate_altering_land } from "@/data/environmental_impact/climate_altering_land";
import { crop_yield } from "@/data/environmental_impact/crop_yield";
import { lifestock_yield } from "@/data/environmental_impact/lifestock_yield";
import { population_growth } from "@/data/human_consequence/population_growth";

export interface ClimateRecord {
  country: string;
  year: number;

  temp: number | null;
  rainfall: number | null;
  sea: number | null;
  seaSurfaceTemp: number | null;
  loss: number | null;
  people: number | null;
  tourists: number | null;
  climateAlteringLand: number | null;
  cropYield: number | null;
  lifestockYield: number | null;
  populationGrowth: number | null;
}

/**
 * Validate incoming dataset entries
 */
function isValidEntry(entry: any): entry is { country: string; year: number; value: number } {
  return (
    entry &&
    typeof entry.country === "string" &&
    typeof entry.year === "number" &&
    Number.isFinite(entry.year) &&
    typeof entry.value === "number" &&
    Number.isFinite(entry.value)
  );
}

export function buildClimateRecords(): ClimateRecord[] {
  const map = new Map<string, ClimateRecord>();

  const getRecord = (country: string, year: number) => {
    const key = `${country}-${year}`;

    if (!map.has(key)) {
      map.set(key, {
        country,
        year,
        temp: null,
        rainfall: null,
        sea: null,
        seaSurfaceTemp: null,
        loss: null,
        people: null,
        tourists: null,
        climateAlteringLand: null,
        cropYield: null,
        lifestockYield: null,
        populationGrowth: null,
      });
    }

    return map.get(key)!;
  };

  /**
   * Safe merge helper
   */
  const safeMerge = (
    dataset: any[],
    field: keyof Omit<ClimateRecord, "country" | "year">
  ) => {
    dataset
      .filter(isValidEntry)
      .forEach((item) => {
        const record = getRecord(item.country, item.year);
        record[field] = item.value as any;
      });
  };

  // ---- SAFE MERGES ----
  safeMerge(surfaceTempAnomalies, "temp");
  safeMerge(rainfallAnomalies, "rainfall");
  safeMerge(seaLevelAnomalies, "sea");
  safeMerge(disasterEconomicLoss, "loss");
  safeMerge(affectedPersons, "people");
  safeMerge(seaSurfaceTempAnomalies, "seaSurfaceTemp");
  safeMerge(tourist_arrival, "tourists");
  safeMerge(climate_altering_land, "climateAlteringLand");
  safeMerge(crop_yield, "cropYield");
  safeMerge(lifestock_yield, "lifestockYield");
  safeMerge(population_growth, "populationGrowth");

  /**
   * Final safety filter:
   * removes any corrupted records just in case
   */
  return [...map.values()].filter(
    (r) =>
      r &&
      typeof r.country === "string" &&
      typeof r.year === "number" &&
      Number.isFinite(r.year)
  );
}