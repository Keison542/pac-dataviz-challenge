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


/* =========================================================
   TYPES
========================================================= */

interface TimeSeriesPoint {
  country: string;
  year: number;
  value: number;
}

interface ClimateRange {
  min: number;
  max: number;
  mean: number;
}

interface ClimateStats {
  temp: ClimateRange;
  rainfall: ClimateRange;
  sea: ClimateRange;
  sea_surface_temperature: ClimateRange;
}


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Sort a time series by year.
 *
 * This is important because .at(-1) and .at(-2)
 * assume that the array is already chronological.
 */
const sortByYear = <T extends TimeSeriesPoint>(data: T[]): T[] => {
  return [...data].sort((a, b) => a.year - b.year);
};


/**
 * Calculate descriptive statistics from the ACTUAL dataset.
 *
 * No manually selected min/max values are used.
 */
const calculateRange = (
  values: number[],
  useAbsolute = false
): ClimateRange => {

  const cleanValues = values
    .filter((v) => Number.isFinite(v))
    .map((v) => (useAbsolute ? Math.abs(v) : v));

  if (cleanValues.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
    };
  }

  const min = Math.min(...cleanValues);
  const max = Math.max(...cleanValues);

  const mean =
    cleanValues.reduce((sum, value) => sum + value, 0) /
    cleanValues.length;

  return {
    min,
    max,
    mean,
  };
};


/**
 * Normalize a value using the observed dataset range.
 *
 * Result: 0–100
 */
const normalizeObserved = (
  value: number,
  range: ClimateRange,
  useAbsolute = false
): number => {

  const numericValue = Number.isFinite(value) ? value : 0;

  const v = useAbsolute
    ? Math.abs(numericValue)
    : numericValue;

  if (range.max === range.min) {
    return 0;
  }

  const normalized =
    ((v - range.min) /
      (range.max - range.min)) *
    100;

  return Math.max(
    0,
    Math.min(100, normalized)
  );
};


/**
 * Calculate percentile from an array.
 *
 * Used for regional climate-index interpretation.
 */
const percentile = (
  value: number,
  values: number[]
): number => {

  if (!values.length) return 0;

  const sorted = [...values]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!sorted.length) return 0;

  const belowOrEqual = sorted.filter(
    (v) => v <= value
  ).length;

  return (belowOrEqual / sorted.length) * 100;
};


/* =========================================================
   MAIN HOOK
========================================================= */

export function useClimateData() {

  const [
    selectedCountry,
    setSelectedCountry
  ] = useState("Fiji");


  /* =======================================================
     COUNTRIES
  ======================================================= */

  const EXCLUDED_COUNTRIES = new Set([
    "Wallis and Futuna",
    "Northern Mariana Islands",
    "Niue",
    "Tokelau",
    "Guam",
    "French Polynesia",
    "Micronesia, Federated State of",
    "Pitcairn",
    "Micronesia (Federated States of)"
  ]);


  const countries = useMemo(() => {

    const all = new Set<string>();

    surfaceTempAnomalies.forEach(
      d => all.add(d.country)
    );

    rainfallAnomalies.forEach(
      d => all.add(d.country)
    );

    seaLevelAnomalies.forEach(
      d => all.add(d.country)
    );

    disasterEconomicLoss.forEach(
      d => all.add(d.country)
    );

    affectedPersons.forEach(
      d => all.add(d.country)
    );

    seaSurfaceTempAnomalies.forEach(
      d => all.add(d.country)
    );

    crop_yield.forEach(
      d => all.add(d.country)
    );

    tourist_arrival.forEach(
      d => all.add(d.country)
    );

    climate_altering_land.forEach(
      d => all.add(d.country)
    );

    lifestock_yield.forEach(
      d => all.add(d.country)
    );

    population_growth.forEach(
      d => all.add(d.country)
    );


    return Array.from(all)
      .filter(
        country =>
          !EXCLUDED_COUNTRIES.has(country)
      )
      .sort();

  }, []);


  /* =======================================================
     COUNTRY FILTER
  ======================================================= */

  const mapTimeSeries = useCallback(
    (data: TimeSeriesPoint[]) => {

      return sortByYear(
        data.filter(
          d => d.country === selectedCountry
        )
      );

    },
    [selectedCountry]
  );


  /* =======================================================
     SELECTED COUNTRY DATA
  ======================================================= */

  const dataMap = useMemo(() => ({

    temp:
      mapTimeSeries(surfaceTempAnomalies),

    rainfall:
      mapTimeSeries(rainfallAnomalies),

    sea:
      mapTimeSeries(seaLevelAnomalies),

    loss:
      mapTimeSeries(disasterEconomicLoss),

    people:
      mapTimeSeries(affectedPersons),

    sea_surface_temperature:
      mapTimeSeries(seaSurfaceTempAnomalies),

    crop_yield:
      mapTimeSeries(crop_yield),

    tourist_arrival:
      mapTimeSeries(tourist_arrival),

    climate_altering_land:
      mapTimeSeries(climate_altering_land),

    lifestock_yield:
      mapTimeSeries(lifestock_yield),

    population_growth:
      mapTimeSeries(population_growth),

  }), [mapTimeSeries]);


  /* =======================================================
     ACTUAL REGIONAL CLIMATE RANGES
     
     IMPORTANT:
     These replace the old hard-coded ranges:
     
     temp: { min: -1, max: 2 }
     SST:  { min: -1, max: 2 }
     rainfall: { min: -100, max: 200 }
     sea: { min: 0, max: 0.5 }
     
     The values now come directly from your datasets.
  ======================================================= */

  const climateStats = useMemo<ClimateStats>(() => {

    return {

      temp: calculateRange(
        surfaceTempAnomalies.map(
          d => d.value
        ),
        true
      ),

      rainfall: calculateRange(
        rainfallAnomalies.map(
          d => d.value
        ),
        true
      ),

      sea: calculateRange(
        seaLevelAnomalies.map(
          d => d.value
        ),
        true
      ),

      sea_surface_temperature:
        calculateRange(
          seaSurfaceTempAnomalies.map(
            d => d.value
          ),
          true
        ),

    };

  }, []);


  /* =======================================================
     KPIs
  ======================================================= */

  const kpis = useMemo(() => ({

    temp:
      dataMap.temp.at(-1)?.value ?? 0,

    rainfall:
      dataMap.rainfall.at(-1)?.value ?? 0,

    sea:
      dataMap.sea.at(-1)?.value ?? 0,

    loss:
      dataMap.loss.at(-1)?.value ?? 0,

    people:
      dataMap.people.at(-1)?.value ?? 0,

    sea_surface_temperature:
      dataMap.sea_surface_temperature.at(-1)?.value ?? 0,

    crop_yield:
      dataMap.crop_yield.at(-1)?.value ?? 0,

    tourist_arrival:
      dataMap.tourist_arrival.at(-1)?.value ?? 0,

    climate_altering_land:
      dataMap.climate_altering_land.at(-1)?.value ?? 0,

    lifestock_yield:
      dataMap.lifestock_yield.at(-1)?.value ?? 0,

    population_growth:
      dataMap.population_growth.at(-1)?.value ?? 0,

  }), [dataMap]);


  /* =======================================================
     YEAR-TO-YEAR DELTAS
  ======================================================= */

  const deltas = useMemo(() => ({

    temp:
      kpis.temp -
      (dataMap.temp.at(-2)?.value ?? 0),

    rainfall:
      kpis.rainfall -
      (dataMap.rainfall.at(-2)?.value ?? 0),

    sea:
      kpis.sea -
      (dataMap.sea.at(-2)?.value ?? 0),

    loss:
      kpis.loss -
      (dataMap.loss.at(-2)?.value ?? 0),

    people:
      kpis.people -
      (dataMap.people.at(-2)?.value ?? 0),

    sea_surface_temperature:
      kpis.sea_surface_temperature -
      (dataMap.sea_surface_temperature.at(-2)?.value ?? 0),

    crop_yield:
      kpis.crop_yield -
      (dataMap.crop_yield.at(-2)?.value ?? 0),

    tourist_arrival:
      kpis.tourist_arrival -
      (dataMap.tourist_arrival.at(-2)?.value ?? 0),

    climate_altering_land:
      kpis.climate_altering_land -
      (dataMap.climate_altering_land.at(-2)?.value ?? 0),

    lifestock_yield:
      kpis.lifestock_yield -
      (dataMap.lifestock_yield.at(-2)?.value ?? 0),

    population_growth:
      kpis.population_growth -
      (dataMap.population_growth.at(-2)?.value ?? 0),

  }), [kpis, dataMap]);


  /* =======================================================
     TREND CALCULATIONS
  ======================================================= */

  const tempTrend =
    dataMap.temp.length > 1 &&
    dataMap.temp[0].value !== 0

      ? (
          (
            dataMap.temp.at(-1)!.value -
            dataMap.temp[0].value
          ) /
          Math.abs(dataMap.temp[0].value)
        ) * 100

      : 0;


  const seaTrend =
    dataMap.sea.length > 1 &&
    dataMap.sea[0].value !== 0

      ? (
          (
            dataMap.sea.at(-1)!.value -
            dataMap.sea[0].value
          ) /
          Math.abs(dataMap.sea[0].value)
        ) * 100

      : 0;


  /* =======================================================
     TOTALS
  ======================================================= */

  const lossTotal =
    dataMap.loss.reduce(
      (sum, d) =>
        sum + d.value,
      0
    );


  const peopleTotal =
    dataMap.people.reduce(
      (sum, d) =>
        sum + d.value,
      0
    );


  /* =======================================================
     OBSERVED ANOMALY INTENSITIES
     
     These are now calculated from the real regional
     distributions instead of arbitrary min/max ranges.
  ======================================================= */

  const anomalyScores = useMemo(() => {

    const tempScore =
      normalizeObserved(
        kpis.temp,
        climateStats.temp,
        true
      );

    const rainfallScore =
      normalizeObserved(
        kpis.rainfall,
        climateStats.rainfall,
        true
      );

    const seaScore =
      normalizeObserved(
        kpis.sea,
        climateStats.sea,
        true
      );

    const seaSurfaceTemperatureScore =
      normalizeObserved(
        kpis.sea_surface_temperature,
        climateStats.sea_surface_temperature,
        true
      );


    return {

      temp:
        Math.round(tempScore),

      rainfall:
        Math.round(rainfallScore),

      sea:
        Math.round(seaScore),

      sea_surface_temperature:
        Math.round(
          seaSurfaceTemperatureScore
        ),

    };

  }, [
    kpis,
    climateStats
  ]);


  /* =======================================================
     CLIMATE INDEX
     
     IMPORTANT:
     The index is calculated from observed regional
     anomaly intensity.
     
     We retain equal weighting here so that one climate
     variable does not dominate simply because it has a
     different measurement scale.
  ======================================================= */

  const climateIndex = useMemo(() => {

    const score =

      anomalyScores.temp * 0.25 +

      anomalyScores.sea_surface_temperature *
        0.25 +

      anomalyScores.rainfall * 0.25 +

      anomalyScores.sea * 0.25;


    return Math.round(
      Math.max(
        0,
        Math.min(100, score)
      )
    );

  }, [anomalyScores]);


  /* =======================================================
     REGIONAL CLIMATE INDEX
     
     Calculate the same index for every country using
     its latest available observations.
     
     This allows us to describe Fiji as, for example,
     "higher than most countries" rather than using
     arbitrary fixed thresholds.
  ======================================================= */

  const regionalClimateIndices = useMemo(() => {

    return countries.map(country => {

      const getLatest = (
        data: TimeSeriesPoint[]
      ) => {

        const records = sortByYear(
          data.filter(
            d => d.country === country
          )
        );

        return records.at(-1)?.value ?? 0;

      };


      const temp =
        getLatest(surfaceTempAnomalies);

      const rainfall =
        getLatest(rainfallAnomalies);

      const sea =
        getLatest(seaLevelAnomalies);

      const seaSurfaceTemperature =
        getLatest(
          seaSurfaceTempAnomalies
        );


      const tempScore =
        normalizeObserved(
          temp,
          climateStats.temp,
          true
        );

      const rainfallScore =
        normalizeObserved(
          rainfall,
          climateStats.rainfall,
          true
        );

      const seaScore =
        normalizeObserved(
          sea,
          climateStats.sea,
          true
        );

      const seaSurfaceTemperatureScore =
        normalizeObserved(
          seaSurfaceTemperature,
          climateStats.sea_surface_temperature,
          true
        );


      const index = Math.round(

        tempScore * 0.25 +

        seaSurfaceTemperatureScore *
          0.25 +

        rainfallScore * 0.25 +

        seaScore * 0.25

      );


      return {
        country,
        index
      };

    });

  }, [
    countries,
    climateStats
  ]);


  /* =======================================================
     CLIMATE INDEX PERCENTILE
  ======================================================= */

  const climateIndexPercentile = useMemo(() => {

    const values =
      regionalClimateIndices.map(
        d => d.index
      );


    return Math.round(
      percentile(
        climateIndex,
        values
      )
    );

  }, [
    regionalClimateIndices,
    climateIndex
  ]);


  /* =======================================================
     DATA-DRIVEN CLIMATE SIGNAL
     
     Instead of:
     
     <25 = Low
     <50 = Moderate
     <75 = High
     else Critical
     
     the interpretation is based on the country's
     position within the observed Pacific distribution.
  ======================================================= */

  const climateSignal = useMemo(() => {

    if (climateIndexPercentile >= 90) {

      return {
        label: "Very High Regional Signal",
        level: "very-high",
        percentile: climateIndexPercentile,
      };

    }

    if (climateIndexPercentile >= 75) {

      return {
        label: "High Regional Signal",
        level: "high",
        percentile: climateIndexPercentile,
      };

    }

    if (climateIndexPercentile >= 50) {

      return {
        label: "Moderate Regional Signal",
        level: "moderate",
        percentile: climateIndexPercentile,
      };

    }

    return {
      label: "Lower Regional Signal",
      level: "lower",
      percentile: climateIndexPercentile,
    };

  }, [
    climateIndexPercentile
  ]);


  /* =======================================================
     SOCIOECONOMIC TIME SERIES
  ======================================================= */

  const timeSeriesData = useMemo(() => {

    const years = new Set<number>();

    crop_yield
      .filter(
        d => d.country === selectedCountry
      )
      .forEach(
        d => years.add(d.year)
      );

    lifestock_yield
      .filter(
        d => d.country === selectedCountry
      )
      .forEach(
        d => years.add(d.year)
      );

    tourist_arrival
      .filter(
        d => d.country === selectedCountry
      )
      .forEach(
        d => years.add(d.year)
      );


    return Array.from(years)
      .sort((a, b) => a - b)
      .map(year => ({

        year,

        cropYield:
          crop_yield.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        livestockYield:
          lifestock_yield.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        touristArrivals:
          tourist_arrival.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

      }));

  }, [selectedCountry]);


  /* =======================================================
     CLIMATE FLOW DATA
  ======================================================= */

  const climateFlowData = useMemo(() => {

    const years = new Set<number>();

    [
      ...surfaceTempAnomalies,
      ...seaSurfaceTempAnomalies,
      ...seaLevelAnomalies,
      ...rainfallAnomalies,
      ...disasterEconomicLoss,
      ...affectedPersons,
      ...tourist_arrival
    ]
      .filter(
        d => d.country === selectedCountry
      )
      .forEach(
        d => years.add(d.year)
      );


    return Array.from(years)
      .sort((a, b) => a - b)
      .map(year => ({

        country: selectedCountry,

        year,

        temp:
          surfaceTempAnomalies.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        sea:
          seaLevelAnomalies.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        rainfall:
          rainfallAnomalies.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        loss:
          disasterEconomicLoss.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        people:
          affectedPersons.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        sea_surface_temperature:
          seaSurfaceTempAnomalies.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        crop_yield:
          crop_yield.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        tourist_arrival:
          tourist_arrival.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        climate_altering_land:
          climate_altering_land.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        lifestock_yield:
          lifestock_yield.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

        population_growth:
          population_growth.find(
            d =>
              d.country === selectedCountry &&
              d.year === year
          )?.value ?? 0,

      }));

  }, [selectedCountry]);


  /* =======================================================
     REGIONAL RANKING DATA
  ======================================================= */

  const rankedData = useMemo(() => {

    const economicLossMap =
      new Map<string, number>();

    disasterEconomicLoss.forEach(d => {

      economicLossMap.set(
        d.country,
        (
          economicLossMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    const cropYieldMap =
      new Map<string, number>();

    crop_yield.forEach(d => {

      cropYieldMap.set(
        d.country,
        (
          cropYieldMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    const touristMap =
      new Map<string, number>();

    tourist_arrival.forEach(d => {

      touristMap.set(
        d.country,
        (
          touristMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    const livestockMap =
      new Map<string, number>();

    lifestock_yield.forEach(d => {

      livestockMap.set(
        d.country,
        (
          livestockMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    const climateMap =
      new Map<string, number>();

    climate_altering_land.forEach(d => {

      climateMap.set(
        d.country,
        (
          climateMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    const populationMap =
      new Map<string, number>();

    population_growth.forEach(d => {

      populationMap.set(
        d.country,
        (
          populationMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    const affectedMap =
      new Map<string, number>();

    affectedPersons.forEach(d => {

      affectedMap.set(
        d.country,
        (
          affectedMap.get(d.country) ||
          0
        ) + d.value
      );

    });


    return {

      economicLoss:
        Array.from(
          economicLossMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

      cropYield:
        Array.from(
          cropYieldMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

      touristArrivals:
        Array.from(
          touristMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

      livestockYield:
        Array.from(
          livestockMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

      climateAlteringLand:
        Array.from(
          climateMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

      populationGrowth:
        Array.from(
          populationMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

      affectedPersons:
        Array.from(
          affectedMap.entries()
        ).map(
          ([country, value]) => ({
            country,
            value
          })
        ),

    };

  }, []);


  /* =======================================================
     MULTI-LINE DATA
  ======================================================= */

  const multiLineData = useMemo(

    () =>
      buildMultiLineData()
        .filter(
          d =>
            d.country ===
            selectedCountry
        ),

    [selectedCountry]

  );


  /* =======================================================
     BEESWARM DATA
  ======================================================= */

  const beeswarmData = useMemo(
    () => buildClimateRecords(),
    []
  );


  /* =======================================================
     DATA AVAILABILITY
  ======================================================= */

  const hasClimateData =
    dataMap.temp.length > 0 ||
    dataMap.sea.length > 0 ||
    dataMap.rainfall.length > 0 ||
    dataMap.sea_surface_temperature.length > 0;


  const hasEconomicData =
    dataMap.loss.length > 0;


  const hasHumanData =
    dataMap.people.length > 0;


  const hasSocioeconomicData =
    timeSeriesData.length > 0;


  const hasRegionalData =
    rankedData.economicLoss.length > 0 ||
    rankedData.cropYield.length > 0;


  const hasCausalData =
    climateFlowData.length > 0;


  const hasTimelineData =
    multiLineData.length > 0;


  /* =======================================================
     RETURN
     
     IMPORTANT:
     climateStats, anomalyScores, climateIndex and
     climateSignal are explicitly returned.
     
     This prevents the "reading temp of undefined"
     problem when the dashboard expects these values.
  ======================================================= */

  return {

    selectedCountry,

    setSelectedCountry,

    countries,

    dataMap,

    kpis,

    deltas,

    climateStats,

    anomalyScores,

    climateIndex,

    climateSignal,

    climateIndexPercentile,

    regionalClimateIndices,

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
