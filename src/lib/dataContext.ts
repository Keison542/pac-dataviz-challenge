// src/lib/dataContext.ts

import { surfaceTempAnomalies } from "@/climatedata/climate_drivers/surface_temp_anomalies";
import { seaSurfaceTempAnomalies } from "@/climatedata/climate_drivers/sea_surface_temp_anomalies";
import { rainfallAnomalies } from "@/climatedata/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/climatedata/climate_drivers/sea_level_anomalies";
import { disasterEconomicLoss } from "@/climatedata/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/climatedata/human_consequence/number_of_persons_affected";
import { crop_yield } from "@/climatedata/environmental_impact/crop_yield";
import { tourist_arrival } from "@/climatedata/economic_consequence/tourist_arrival";
import { climate_altering_land } from "@/climatedata/environmental_impact/climate_altering_land";
import { lifestock_yield } from "@/climatedata/environmental_impact/lifestock_yield";
import { population_growth } from "@/climatedata/human_consequence/population_growth";
import { tubercolosis_incidence } from "@/climatedata/human_consequence/tubercolosis_incidence";

export interface DataSetInfo {
  data: any[];
  countryCount: number;
  totalRecords: number;
  pacificTrend: number;
  years: number[];
  minYear: number;
  maxYear: number;
}

export interface FullDataContext {
  years: {
    min: number;
    max: number;
    count: number;
  };
  countries: string[];
  surfaceTemp: DataSetInfo;
  seaSurfaceTemp: DataSetInfo;
  rainfall: DataSetInfo;
  seaLevel: DataSetInfo;
  landCover: DataSetInfo;
  cropYield: DataSetInfo;
  livestockYield: DataSetInfo;
  economicLoss: DataSetInfo;
  tourism: DataSetInfo;
  peopleAffected: DataSetInfo;
  populationGrowth: DataSetInfo;
  tbIncidence: DataSetInfo;
  regionalComparison: {
    topEconomicLoss: { country: string; value: number };
    topPeopleAffected: { country: string; value: number };
    totalEconomicLoss: number;
    totalPeopleAffected: number;
  };
}

const calculateTrend = (data: any[]): number => {
  if (data.length < 2) return 0;
  const firstYear = Math.min(...data.map(d => d.year));
  const lastYear = Math.max(...data.map(d => d.year));
  const firstValue = data.find(d => d.year === firstYear)?.value ?? 0;
  const lastValue = data.find(d => d.year === lastYear)?.value ?? 0;
  if (firstValue === 0) return 0;
  return ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
};

const getYearsRange = (data: any[]): { min: number; max: number; count: number } => {
  const years = data.map(d => d.year);
  return {
    min: Math.min(...years),
    max: Math.max(...years),
    count: new Set(years).size
  };
};

const createDataSetInfo = (data: any[]): DataSetInfo => {
  const countries = new Set(data.map(d => d.country));
  return {
    data,
    countryCount: countries.size,
    totalRecords: data.length,
    pacificTrend: calculateTrend(data),
    years: Array.from(new Set(data.map(d => d.year))).sort(),
    minYear: Math.min(...data.map(d => d.year)),
    maxYear: Math.max(...data.map(d => d.year))
  };
};

export const getTimeSeriesSummary = (data: any[], indicatorName: string, country: string) => {
  const countryData = data.filter(d => d.country === country);
  if (countryData.length === 0) return `No ${indicatorName} data available for ${country}`;
  
  const values = countryData.map(d => d.value);
  const years = countryData.map(d => d.year);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minYear = years[values.indexOf(minValue)];
  const maxYear = years[values.indexOf(maxValue)];
  const latestValue = values[values.length - 1];
  const latestYear = years[years.length - 1];
  const firstValue = values[0];
  const firstYear = years[0];
  const percentChange = ((latestValue - firstValue) / Math.abs(firstValue)) * 100;
  
  const step = Math.floor(years.length / 4);
  const keyYears = years.filter((_, i) => i % step === 0 || i === years.length - 1).slice(0, 5);
  const keyValues = keyYears.map(y => values[years.indexOf(y)]);
  
  return {
    minValue, minYear, maxValue, maxYear,
    latestValue, latestYear, firstValue, firstYear,
    percentChange, keyYears, keyValues, totalYears: years.length,
    trend: percentChange > 5 ? "increasing" : percentChange < -5 ? "decreasing" : "stable"
  };
};

export const buildFullDataContext = (
  regionalLossData: any[],
  regionalAffectedData: any[]
): FullDataContext => {
  const allCountries = new Set<string>();
  
  surfaceTempAnomalies.forEach(d => allCountries.add(d.country));
  seaSurfaceTempAnomalies.forEach(d => allCountries.add(d.country));
  rainfallAnomalies.forEach(d => allCountries.add(d.country));
  seaLevelAnomalies.forEach(d => allCountries.add(d.country));
  disasterEconomicLoss.forEach(d => allCountries.add(d.country));
  affectedPersons.forEach(d => allCountries.add(d.country));
  crop_yield.forEach(d => allCountries.add(d.country));
  tourist_arrival.forEach(d => allCountries.add(d.country));
  climate_altering_land.forEach(d => allCountries.add(d.country));
  lifestock_yield.forEach(d => allCountries.add(d.country));
  population_growth.forEach(d => allCountries.add(d.country));
  tubercolosis_incidence.forEach(d => allCountries.add(d.country));

  const allData = [
    ...surfaceTempAnomalies,
    ...seaSurfaceTempAnomalies,
    ...rainfallAnomalies,
    ...seaLevelAnomalies,
    ...disasterEconomicLoss,
    ...affectedPersons,
    ...crop_yield,
    ...tourist_arrival,
    ...climate_altering_land,
    ...lifestock_yield,
    ...population_growth,
    ...tubercolosis_incidence
  ];

  return {
    years: getYearsRange(allData),
    countries: Array.from(allCountries).sort(),
    surfaceTemp: createDataSetInfo(surfaceTempAnomalies),
    seaSurfaceTemp: createDataSetInfo(seaSurfaceTempAnomalies),
    rainfall: createDataSetInfo(rainfallAnomalies),
    seaLevel: createDataSetInfo(seaLevelAnomalies),
    landCover: createDataSetInfo(climate_altering_land),
    cropYield: createDataSetInfo(crop_yield),
    livestockYield: createDataSetInfo(lifestock_yield),
    economicLoss: createDataSetInfo(disasterEconomicLoss),
    tourism: createDataSetInfo(tourist_arrival),
    peopleAffected: createDataSetInfo(affectedPersons),
    populationGrowth: createDataSetInfo(population_growth),
    tbIncidence: createDataSetInfo(tubercolosis_incidence),
    regionalComparison: {
      topEconomicLoss: regionalLossData[0] || { country: "N/A", value: 0 },
      topPeopleAffected: regionalAffectedData[0] || { country: "N/A", value: 0 },
      totalEconomicLoss: regionalLossData.reduce((sum, d) => sum + d.value, 0) / 1e6,
      totalPeopleAffected: regionalAffectedData.reduce((sum, d) => sum + d.value, 0) / 1e3
    }
  };
};