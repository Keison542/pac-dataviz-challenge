import { useMemo, useCallback, useState } from "react";
import { surfaceTempAnomalies } from "@/climatedata/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/climatedata/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/climatedata/climate_drivers/sea_level_anomalies";
import { disasterEconomicLoss } from "@/climatedata/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/climatedata/human_consequence/number_of_persons_affected";
import { seaSurfaceTempAnomalies } from "@/climatedata/climate_drivers/sea_surface_temp_anomalies";
import { crop_yield } from "@/climatedata/environmental_impact/crop_yield";
import { tourist_arrival } from "@/climatedata/economic_consequence/tourist_arrival";
import { climate_altering_land } from "@/climatedata/environmental_impact/climate_altering_land";
import { lifestock_yield } from "@/climatedata/environmental_impact/lifestock_yield";
import { population_growth } from "@/climatedata/human_consequence/population_growth";
import { buildMultiLineData } from "@/climatedata/climate_drivers/buildMultiLineData";
import { buildClimateRecords } from "@/lib/mergedClimateRecord";

interface TimeSeriesPoint { country: string; year: number; value: number; }

export function useClimateData() {
  const [selectedCountry, setSelectedCountry] = useState("Fiji");
  
  const countries = useMemo(() => {
    const all = new Set<string>();
    surfaceTempAnomalies.forEach(d => all.add(d.country));
    rainfallAnomalies.forEach(d => all.add(d.country));
    seaLevelAnomalies.forEach(d => all.add(d.country));
    disasterEconomicLoss.forEach(d => all.add(d.country));
    affectedPersons.forEach(d => all.add(d.country));
    seaSurfaceTempAnomalies.forEach(d => all.add(d.country));
    crop_yield.forEach(d => all.add(d.country));
    tourist_arrival.forEach(d => all.add(d.country));
    climate_altering_land.forEach(d => all.add(d.country));
    lifestock_yield.forEach(d => all.add(d.country));
    population_growth.forEach(d => all.add(d.country));
    return Array.from(all).sort();
  }, []);
  
  const mapTimeSeries = useCallback((data: TimeSeriesPoint[]) => 
    data.filter(d => d.country === selectedCountry), [selectedCountry]);
  
  const dataMap = useMemo(() => ({
    temp: mapTimeSeries(surfaceTempAnomalies),
    rainfall: mapTimeSeries(rainfallAnomalies),
    sea: mapTimeSeries(seaLevelAnomalies),
    loss: mapTimeSeries(disasterEconomicLoss),
    people: mapTimeSeries(affectedPersons),
    sea_surface_temperature: mapTimeSeries(seaSurfaceTempAnomalies),
    crop_yield: mapTimeSeries(crop_yield),
    tourist_arrival: mapTimeSeries(tourist_arrival),
    climate_altering_land: mapTimeSeries(climate_altering_land),
    lifestock_yield: mapTimeSeries(lifestock_yield),
    population_growth: mapTimeSeries(population_growth),
  }), [mapTimeSeries]);

  const kpis = useMemo(() => ({
    temp: dataMap.temp.at(-1)?.value ?? 0,
    rainfall: dataMap.rainfall.at(-1)?.value ?? 0,
    sea: dataMap.sea.at(-1)?.value ?? 0,
    loss: dataMap.loss.at(-1)?.value ?? 0,
    people: dataMap.people.at(-1)?.value ?? 0,
    sea_surface_temperature: dataMap.sea_surface_temperature.at(-1)?.value ?? 0,
    crop_yield: dataMap.crop_yield.at(-1)?.value ?? 0,
    tourist_arrival: dataMap.tourist_arrival.at(-1)?.value ?? 0,
    climate_altering_land: dataMap.climate_altering_land.at(-1)?.value ?? 0,
    lifestock_yield: dataMap.lifestock_yield.at(-1)?.value ?? 0,
    population_growth: dataMap.population_growth.at(-1)?.value ?? 0,
  }), [dataMap]);
  
  const deltas = useMemo(() => ({
    temp: kpis.temp - (dataMap.temp.at(-2)?.value ?? 0),
    rainfall: kpis.rainfall - (dataMap.rainfall.at(-2)?.value ?? 0),
    sea: kpis.sea - (dataMap.sea.at(-2)?.value ?? 0),
    loss: kpis.loss - (dataMap.loss.at(-2)?.value ?? 0),
    people: kpis.people - (dataMap.people.at(-2)?.value ?? 0),
    sea_surface_temperature: kpis.sea_surface_temperature - (dataMap.sea_surface_temperature.at(-2)?.value ?? 0),
    crop_yield: kpis.crop_yield - (dataMap.crop_yield.at(-2)?.value ?? 0),
    tourist_arrival: kpis.tourist_arrival - (dataMap.tourist_arrival.at(-2)?.value ?? 0),
    climate_altering_land: kpis.climate_altering_land - (dataMap.climate_altering_land.at(-2)?.value ?? 0),
    lifestock_yield: kpis.lifestock_yield - (dataMap.lifestock_yield.at(-2)?.value ?? 0),
    population_growth: kpis.population_growth - (dataMap.population_growth.at(-2)?.value ?? 0),
  }), [kpis, dataMap]);

  const tempTrend = dataMap.temp.length > 1 && dataMap.temp[0].value !== 0 
    ? ((dataMap.temp[dataMap.temp.length - 1].value - dataMap.temp[0].value) / Math.abs(dataMap.temp[0].value)) * 100 
    : 0;
    
  const seaTrend = dataMap.sea.length > 1 && dataMap.sea[0].value !== 0 
    ? ((dataMap.sea[dataMap.sea.length - 1].value - dataMap.sea[0].value) / Math.abs(dataMap.sea[0].value)) * 100 
    : 0;
    
  const lossTotal = dataMap.loss.reduce((sum, d) => sum + d.value, 0);
  const peopleTotal = dataMap.people.reduce((sum, d) => sum + d.value, 0);

  const timeSeriesData = useMemo(() => {
    const years = new Set<number>();
    crop_yield.filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    lifestock_yield.filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    tourist_arrival.filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    return Array.from(years).sort().map(year => ({
      year,
      cropYield: crop_yield.find(d => d.country === selectedCountry && d.year === year)?.value || 0,
      livestockYield: lifestock_yield.find(d => d.country === selectedCountry && d.year === year)?.value || 0,
      touristArrivals: tourist_arrival.find(d => d.country === selectedCountry && d.year === year)?.value || 0
    }));
  }, [selectedCountry]);

  const climateFlowData = useMemo(() => {
    const years = new Set<number>();
    [...surfaceTempAnomalies, ...seaSurfaceTempAnomalies, ...seaLevelAnomalies, ...rainfallAnomalies, ...disasterEconomicLoss, ...affectedPersons, ...tourist_arrival]
      .filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    return Array.from(years).sort().map(year => ({
      country: selectedCountry, year,
      temp: surfaceTempAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      sea: seaLevelAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      rainfall: rainfallAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      loss: disasterEconomicLoss.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      people: affectedPersons.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      sea_surface_temperature: seaSurfaceTempAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      crop_yield: crop_yield.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      tourist_arrival: tourist_arrival.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      climate_altering_land: climate_altering_land.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      lifestock_yield: lifestock_yield.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      population_growth: population_growth.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
    }));
  }, [selectedCountry]);

  const rankedData = useMemo(() => {
    const economicLossMap = new Map<string, number>();
    disasterEconomicLoss.forEach(d => economicLossMap.set(d.country, (economicLossMap.get(d.country) || 0) + d.value));
    const cropYieldMap = new Map<string, number>();
    crop_yield.forEach(d => cropYieldMap.set(d.country, (cropYieldMap.get(d.country) || 0) + d.value));
    const touristMap = new Map<string, number>();
    tourist_arrival.forEach(d => touristMap.set(d.country, (touristMap.get(d.country) || 0) + d.value));
    const livestockMap = new Map<string, number>();
    lifestock_yield.forEach(d => livestockMap.set(d.country, (livestockMap.get(d.country) || 0) + d.value));
    const climateMap = new Map<string, number>();
    climate_altering_land.forEach(d => climateMap.set(d.country, (climateMap.get(d.country) || 0) + d.value));
    const populationMap = new Map<string, number>();
    population_growth.forEach(d => populationMap.set(d.country, (populationMap.get(d.country) || 0) + d.value));
    const affectedMap = new Map<string, number>();
    affectedPersons.forEach(d => affectedMap.set(d.country, (affectedMap.get(d.country) || 0) + d.value));
    
    return {
      economicLoss: Array.from(economicLossMap.entries()).map(([country, value]) => ({ country, value })),
      cropYield: Array.from(cropYieldMap.entries()).map(([country, value]) => ({ country, value })),
      touristArrivals: Array.from(touristMap.entries()).map(([country, value]) => ({ country, value })),
      livestockYield: Array.from(livestockMap.entries()).map(([country, value]) => ({ country, value })),
      climateAlteringLand: Array.from(climateMap.entries()).map(([country, value]) => ({ country, value })),
      populationGrowth: Array.from(populationMap.entries()).map(([country, value]) => ({ country, value })),
      affectedPersons: Array.from(affectedMap.entries()).map(([country, value]) => ({ country, value }))
    };
  }, []);

  const multiLineData = useMemo(() => buildMultiLineData().filter(d => d.country === selectedCountry), [selectedCountry]);
  const beeswarmData = useMemo(() => buildClimateRecords(), []);
  
  const hasClimateData = dataMap.temp.length > 0 || dataMap.sea.length > 0 || dataMap.rainfall.length > 0 || dataMap.sea_surface_temperature.length > 0;
  const hasEconomicData = dataMap.loss.length > 0;
  const hasHumanData = dataMap.people.length > 0;
  const hasSocioeconomicData = timeSeriesData.length > 0;
  const hasRegionalData = rankedData.economicLoss.length > 0 || rankedData.cropYield.length > 0;
  const hasCausalData = climateFlowData.length > 0;
  const hasTimelineData = multiLineData.length > 0;

  return {
    selectedCountry,
    setSelectedCountry,
    countries,
    dataMap,
    kpis,
    deltas,
    timeSeriesData,
    climateFlowData,
    rankedData,
    multiLineData,
    beeswarmData,
    tempTrend,
    seaTrend,
    lossTotal,
    peopleTotal,
    hasClimateData,
    hasEconomicData,
    hasHumanData,
    hasSocioeconomicData,
    hasRegionalData,
    hasCausalData,
    hasTimelineData,
  };
}