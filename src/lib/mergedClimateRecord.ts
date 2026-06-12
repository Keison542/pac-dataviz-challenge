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

function isValid(entry: any): boolean {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.country === "string" &&
    typeof entry.year === "number" &&
    !isNaN(entry.year)
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

  const safeForEach = (data: any[], cb: (d: any) => void) => {
    data.forEach((item) => {
      if (isValid(item)) cb(item);
    });
  };

  safeForEach(surfaceTempAnomalies, (a) => {
    getRecord(a.country, a.year).temp = a.value;
  });

  safeForEach(rainfallAnomalies, (a) => {
    getRecord(a.country, a.year).rainfall = a.value;
  });

  safeForEach(seaLevelAnomalies, (a) => {
    getRecord(a.country, a.year).sea = a.value;
  });

  safeForEach(disasterEconomicLoss, (a) => {
    getRecord(a.country, a.year).loss = a.value;
  });

  safeForEach(affectedPersons, (a) => {
    getRecord(a.country, a.year).people = a.value;
  });

  safeForEach(seaSurfaceTempAnomalies, (a) => {
    getRecord(a.country, a.year).seaSurfaceTemp = a.value;
  });

  safeForEach(tourist_arrival, (a) => {
    getRecord(a.country, a.year).tourists = a.value;
  });

  safeForEach(climate_altering_land, (a) => {
    getRecord(a.country, a.year).climateAlteringLand = a.value;
  });

  safeForEach(crop_yield, (a) => {
    getRecord(a.country, a.year).cropYield = a.value;
  });

  safeForEach(lifestock_yield, (a) => {
    getRecord(a.country, a.year).lifestockYield = a.value;
  });

  safeForEach(population_growth, (a) => {
    getRecord(a.country, a.year).populationGrowth = a.value;
  });

  return Array.from(map.values());
}