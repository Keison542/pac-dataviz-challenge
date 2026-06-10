// src/lib/climateRecord.ts

import { surfaceTempAnomalies } from "@/data/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/data/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/data/climate_drivers/sea_level_anomalies";
import {disasterEconomicLoss} from "@/data/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/data/human_consequence/number_of_persons_affected";
import { seaSurfaceTempAnomalies } from "@/data/climate_drivers/sea_surface_temp_anomalies";

export interface ClimateRecord {
  country: string;
  year: number;

  temp: number | null;
  rainfall: number | null;
  sea: number | null;
  seaSurfaceTemp: number | null;
  loss: number | null;
  people: number | null;
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

  return [...map.values()];
}