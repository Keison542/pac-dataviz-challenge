// src/lib/climateRecord.ts

import { surfaceTempAnomalies } from "@/data/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/data/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/data/climate_drivers/sea_level_anomalies";
import {disasterEconomicLoss} from "@/data/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/data/human_consequence/number_of_persons_affected";
import { seaSurfaceTempAnomalies } from "@/data/climate_drivers/sea_surface_temp_anomalies";
import {tourist_arrival} from "@/data/economic_consequence/tourist_arrival";
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

  // merge datasets here
  surfaceTempAnomalies.forEach((anomaly) => {
    const record = getRecord(anomaly.country, anomaly.year);
    record.temp = anomaly.value;
  });

  rainfallAnomalies.forEach((anomaly) => {
    const record = getRecord(anomaly.country, anomaly.year);
    record.rainfall = anomaly.value;
  });

  seaLevelAnomalies.forEach((anomaly) => {
    const record = getRecord(anomaly.country, anomaly.year);
    record.sea = anomaly.value;
  });

  disasterEconomicLoss.forEach((loss) => {
    const record = getRecord(loss.country, loss.year);
    record.loss = loss.value;
  });

  affectedPersons.forEach((affected) => {
    const record = getRecord(affected.country, affected.year);
    record.people = affected.value;
  });

  seaSurfaceTempAnomalies.forEach((anomaly) => {
    const record = getRecord(anomaly.country, anomaly.year);
    record.seaSurfaceTemp = anomaly.value;
  });

  tourist_arrival.forEach((arrival) => {
    const record = getRecord(arrival.country, arrival.year);
    record.tourists = arrival.value;
  });

  climate_altering_land.forEach((land) => {
    const record = getRecord(land.country, land.year);
    record.climateAlteringLand = land.value;
  });

  crop_yield.forEach((yieldData) => {
    const record = getRecord(yieldData.country, yieldData.year);
    record.cropYield = yieldData.value;
  });

  lifestock_yield.forEach((yieldData) => {
    const record = getRecord(yieldData.country, yieldData.year);
    record.lifestockYield = yieldData.value;
  });

  population_growth.forEach((growthData) => {
    const record = getRecord(growthData.country, growthData.year);
    record.populationGrowth = growthData.value;
  });

  return [...map.values()];
}