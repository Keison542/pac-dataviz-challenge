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


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/*
 * Return the latest valid observation for each country.
 *
 * IMPORTANT:
 * The data are sorted by year rather than assuming the
 * source arrays are already ordered.
 */

function latestByCountry(
  data: TimeSeriesPoint[]
): Map<string, number> {

  const latest = new Map<
    string,
    TimeSeriesPoint
  >();

  data.forEach((d) => {

    if (
      !d.country ||
      !Number.isFinite(d.value) ||
      !Number.isFinite(d.year)
    ) {
      return;
    }

    const existing =
      latest.get(d.country);

    if (
      !existing ||
      d.year > existing.year
    ) {
      latest.set(
        d.country,
        d
      );
    }

  });

  return new Map(
    Array.from(
      latest.entries()
    ).map(
      ([country, record]) => [
        country,
        record.value
      ]
    )
  );
}


/*
 * Convert a country's value to a 0–100 score based on
 * the observed Pacific-wide distribution.
 *
 * NO hard-coded min/max values.
 */

function relativeScore(
  value: number,
  regionalValues: number[]
): number {

  const values =
    regionalValues.filter(
      Number.isFinite
    );

  if (
    values.length < 2 ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  const min =
    Math.min(...values);

  const max =
    Math.max(...values);

  /*
   * If every country has the same value there is no
   * cross-country variation.
   */

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max === min
  ) {
    return 50;
  }

  const score =
    ((value - min) /
      (max - min)) *
    100;

  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    )
  );
}


/*
 * Percentile rank.
 *
 * Returns the percentage of countries whose score is
 * lower than or equal to the selected country's score.
 */

function percentileRank(
  value: number,
  values: number[]
): number {

  const validValues =
    values.filter(
      Number.isFinite
    );

  if (
    validValues.length < 2 ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  const count =
    validValues.filter(
      (v) => v <= value
    ).length;

  return Math.round(
    (count /
      validValues.length) *
      100
  );
}


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

  const EXCLUDED_COUNTRIES =
    new Set([
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


  const countries =
    useMemo(() => {

      const all =
        new Set<string>();

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
            !EXCLUDED_COUNTRIES.has(
              country
            )
        )
        .sort();

    }, []);


  /* =======================================================
     SELECTED COUNTRY DATA
  ======================================================= */

  const mapTimeSeries =
    useCallback(
      (
        data: TimeSeriesPoint[]
      ) =>
        data
          .filter(
            d =>
              d.country ===
              selectedCountry
          )
          .sort(
            (a, b) =>
              a.year - b.year
          ),
      [selectedCountry]
    );


  const dataMap =
    useMemo(
      () => ({

        temp:
          mapTimeSeries(
            surfaceTempAnomalies
          ),

        rainfall:
          mapTimeSeries(
            rainfallAnomalies
          ),

        sea:
          mapTimeSeries(
            seaLevelAnomalies
          ),

        loss:
          mapTimeSeries(
            disasterEconomicLoss
          ),

        people:
          mapTimeSeries(
            affectedPersons
          ),

        sea_surface_temperature:
          mapTimeSeries(
            seaSurfaceTempAnomalies
          ),

        crop_yield:
          mapTimeSeries(
            crop_yield
          ),

        tourist_arrival:
          mapTimeSeries(
            tourist_arrival
          ),

        climate_altering_land:
          mapTimeSeries(
            climate_altering_land
          ),

        lifestock_yield:
          mapTimeSeries(
            lifestock_yield
          ),

        population_growth:
          mapTimeSeries(
            population_growth
          ),

      }),
      [mapTimeSeries]
    );


  /* =======================================================
     KPI VALUES
  ======================================================= */

  const kpis =
    useMemo(
      () => ({

        temp:
          dataMap.temp.at(-1)?.value ??
          0,

        rainfall:
          dataMap.rainfall.at(-1)?.value ??
          0,

        sea:
          dataMap.sea.at(-1)?.value ??
          0,

        loss:
          dataMap.loss.at(-1)?.value ??
          0,

        people:
          dataMap.people.at(-1)?.value ??
          0,

        sea_surface_temperature:
          dataMap
            .sea_surface_temperature
            .at(-1)?.value ??
          0,

        crop_yield:
          dataMap.crop_yield.at(-1)?.value ??
          0,

        tourist_arrival:
          dataMap
            .tourist_arrival
            .at(-1)?.value ??
          0,

        climate_altering_land:
          dataMap
            .climate_altering_land
            .at(-1)?.value ??
          0,

        lifestock_yield:
          dataMap
            .lifestock_yield
            .at(-1)?.value ??
          0,

        population_growth:
          dataMap
            .population_growth
            .at(-1)?.value ??
          0,

      }),
      [dataMap]
    );


  /* =======================================================
     DELTAS
  ======================================================= */

  const deltas =
    useMemo(
      () => ({

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
          (
            dataMap
              .sea_surface_temperature
              .at(-2)?.value ??
            0
          ),

        crop_yield:
          kpis.crop_yield -
          (
            dataMap
              .crop_yield
              .at(-2)?.value ??
            0
          ),

        tourist_arrival:
          kpis.tourist_arrival -
          (
            dataMap
              .tourist_arrival
              .at(-2)?.value ??
            0
          ),

        climate_altering_land:
          kpis.climate_altering_land -
          (
            dataMap
              .climate_altering_land
              .at(-2)?.value ??
            0
          ),

        lifestock_yield:
          kpis.lifestock_yield -
          (
            dataMap
              .lifestock_yield
              .at(-2)?.value ??
            0
          ),

        population_growth:
          kpis.population_growth -
          (
            dataMap
              .population_growth
              .at(-2)?.value ??
            0
          ),

      }),
      [kpis, dataMap]
    );


  /* =======================================================
     TREND VALUES
  ======================================================= */

  const tempTrend =
    dataMap.temp.length > 1 &&
    dataMap.temp[0].value !== 0

      ? (
          (
            dataMap.temp.at(-1)!.value -
            dataMap.temp[0].value
          ) /
          Math.abs(
            dataMap.temp[0].value
          )
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
          Math.abs(
            dataMap.sea[0].value
          )
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
     PACIFIC-WIDE LATEST VALUES
     
     THIS IS THE IMPORTANT FIX.
     
     These distributions are calculated across ALL
     countries rather than the selected country.
  ======================================================= */

  const regionalClimate =
    useMemo(() => {

      const tempLatest =
        latestByCountry(
          surfaceTempAnomalies
        );

      const rainfallLatest =
        latestByCountry(
          rainfallAnomalies
        );

      const seaLatest =
        latestByCountry(
          seaLevelAnomalies
        );

      const seaSurfaceLatest =
        latestByCountry(
          seaSurfaceTempAnomalies
        );


      /*
       * Only include countries that actually exist in
       * the climate datasets.
       */

      const regionalCountries =
        Array.from(
          new Set([
            ...tempLatest.keys(),
            ...rainfallLatest.keys(),
            ...seaLatest.keys(),
            ...seaSurfaceLatest.keys(),
          ])
        ).filter(
          country =>
            !EXCLUDED_COUNTRIES.has(
              country
            )
        );


      return {

        tempLatest,

        rainfallLatest,

        seaLatest,

        seaSurfaceLatest,

        regionalCountries,

      };

    }, []);


  /* =======================================================
     PACIFIC-WIDE ANOMALY SCORES
  ======================================================= */

  const anomalyScores =
    useMemo(() => {

      const tempValue =
        regionalClimate
          .tempLatest
          .get(selectedCountry) ??
        0;

      const rainfallValue =
        regionalClimate
          .rainfallLatest
          .get(selectedCountry) ??
        0;

      const seaValue =
        regionalClimate
          .seaLatest
          .get(selectedCountry) ??
        0;

      const seaSurfaceValue =
        regionalClimate
          .seaSurfaceLatest
          .get(selectedCountry) ??
        0;


      const tempScore =
        relativeScore(
          Math.abs(tempValue),
          Array.from(
            regionalClimate
              .tempLatest
              .values()
          ).map(
            v => Math.abs(v)
          )
        );


      const rainfallScore =
        relativeScore(
          Math.abs(rainfallValue),
          Array.from(
            regionalClimate
              .rainfallLatest
              .values()
          ).map(
            v => Math.abs(v)
          )
        );


      const seaScore =
        relativeScore(
          Math.abs(seaValue),
          Array.from(
            regionalClimate
              .seaLatest
              .values()
          ).map(
            v => Math.abs(v)
          )
        );


      const seaSurfaceScore =
        relativeScore(
          Math.abs(seaSurfaceValue),
          Array.from(
            regionalClimate
              .seaSurfaceLatest
              .values()
          ).map(
            v => Math.abs(v)
          )
        );


      return {

        temp:
          tempScore,

        rainfall:
          rainfallScore,

        sea:
          seaScore,

        sea_surface_temperature:
          seaSurfaceScore,

      };

    }, [
      selectedCountry,
      regionalClimate,
    ]);


  /* =======================================================
     COMPOSITE CLIMATE SIGNAL
  ======================================================= */

  const climateIndex =
    useMemo(() => {

      const scores = [
        anomalyScores.temp,
        anomalyScores.rainfall,
        anomalyScores.sea,
        anomalyScores.sea_surface_temperature,
      ];

      const valid =
        scores.filter(
          Number.isFinite
        );


      if (
        valid.length === 0
      ) {
        return 0;
      }


      /*
       * Equal weighting.
       *
       * This is deliberately transparent and avoids
       * inventing scientific weights.
       */

      const mean =
        valid.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        valid.length;


      return Math.round(
        Math.max(
          0,
          Math.min(
            100,
            mean
          )
        )
      );

    }, [
      anomalyScores
    ]);


  /* =======================================================
     PACIFIC-WIDE COMPOSITE SCORES
     
     Calculate the composite for every country so that
     the selected country can be placed in the regional
     distribution.
  ======================================================= */

  const regionalCompositeScores =
    useMemo(() => {

      const scores =
        new Map<
          string,
          number
        >();


      regionalClimate.regionalCountries
        .forEach(country => {

          const temp =
            regionalClimate
              .tempLatest
              .get(country);

          const rainfall =
            regionalClimate
              .rainfallLatest
              .get(country);

          const sea =
            regionalClimate
              .seaLatest
              .get(country);

          const seaSurface =
            regionalClimate
              .seaSurfaceLatest
              .get(country);


          const tempScore =
            Number.isFinite(temp)
              ? relativeScore(
                  Math.abs(temp!),
                  Array.from(
                    regionalClimate
                      .tempLatest
                      .values()
                  ).map(
                    v =>
                      Math.abs(v)
                  )
                )
              : null;


          const rainfallScore =
            Number.isFinite(rainfall)
              ? relativeScore(
                  Math.abs(rainfall!),
                  Array.from(
                    regionalClimate
                      .rainfallLatest
                      .values()
                  ).map(
                    v =>
                      Math.abs(v)
                  )
                )
              : null;


          const seaScore =
            Number.isFinite(sea)
              ? relativeScore(
                  Math.abs(sea!),
                  Array.from(
                    regionalClimate
                      .seaLatest
                      .values()
                  ).map(
                    v =>
                      Math.abs(v)
                  )
                )
              : null;


          const seaSurfaceScore =
            Number.isFinite(seaSurface)
              ? relativeScore(
                  Math.abs(seaSurface!),
                  Array.from(
                    regionalClimate
                      .seaSurfaceLatest
                      .values()
                  ).map(
                    v =>
                      Math.abs(v)
                  )
                )
              : null;


          const countryScores = [
            tempScore,
            rainfallScore,
            seaScore,
            seaSurfaceScore,
          ].filter(
            (
              v
            ): v is number =>
              v !== null &&
              Number.isFinite(v)
          );


          if (
            countryScores.length > 0
          ) {

            const composite =
              countryScores.reduce(
                (
                  sum,
                  value
                ) =>
                  sum + value,
                0
              ) /
              countryScores.length;


            scores.set(
              country,
              Math.round(
                composite
              )
            );

          }

        });


      return scores;

    }, [
      regionalClimate
    ]);


  /* =======================================================
     COUNTRY PERCENTILE
  ======================================================= */

  const climatePercentile =
    useMemo(() => {

      const regionalScores =
        Array.from(
          regionalCompositeScores.values()
        );


      return percentileRank(
        climateIndex,
        regionalScores
      );

    }, [
      climateIndex,
      regionalCompositeScores
    ]);


  /* =======================================================
     CLIMATE SIGNAL LABEL
     
     These are presentation categories, not scientific
     thresholds.
  ======================================================= */

  const climateSignal =
    useMemo(() => {

      if (
        climatePercentile >= 90
      ) {

        return {
          label:
            "Very High Regional Signal",

          level:
            "very-high",

          percentile:
            climatePercentile,
        };

      }


      if (
        climatePercentile >= 70
      ) {

        return {
          label:
            "High Regional Signal",

          level:
            "high",

          percentile:
            climatePercentile,
        };

      }


      if (
        climatePercentile >= 40
      ) {

        return {
          label:
            "Moderate Regional Signal",

          level:
            "moderate",

          percentile:
            climatePercentile,
        };

      }


      return {

        label:
          "Lower Regional Signal",

        level:
          "lower",

        percentile:
          climatePercentile,

      };

    }, [
      climatePercentile
    ]);


  /* =======================================================
     SOCIOECONOMIC TIME SERIES
  ======================================================= */

  const timeSeriesData =
    useMemo(() => {

      const years =
        new Set<number>();


      crop_yield
        .filter(
          d =>
            d.country ===
            selectedCountry
        )
        .forEach(
          d =>
            years.add(
              d.year
            )
        );


      lifestock_yield
        .filter(
          d =>
            d.country ===
            selectedCountry
        )
        .forEach(
          d =>
            years.add(
              d.year
            )
        );


      tourist_arrival
        .filter(
          d =>
            d.country ===
            selectedCountry
        )
        .forEach(
          d =>
            years.add(
              d.year
            )
        );


      return Array.from(years)
        .sort()
        .map(year => ({

          year,

          cropYield:
            crop_yield.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          livestockYield:
            lifestock_yield.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          touristArrivals:
            tourist_arrival.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

        }));

    }, [
      selectedCountry
    ]);


  /* =======================================================
     CLIMATE FLOW DATA
  ======================================================= */

  const climateFlowData =
    useMemo(() => {

      const years =
        new Set<number>();


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
          d =>
            d.country ===
            selectedCountry
        )
        .forEach(
          d =>
            years.add(
              d.year
            )
        );


      return Array.from(years)
        .sort()
        .map(year => ({

          country:
            selectedCountry,

          year,

          temp:
            surfaceTempAnomalies.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          sea:
            seaLevelAnomalies.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          rainfall:
            rainfallAnomalies.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          loss:
            disasterEconomicLoss.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          people:
            affectedPersons.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          sea_surface_temperature:
            seaSurfaceTempAnomalies.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          crop_yield:
            crop_yield.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          tourist_arrival:
            tourist_arrival.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          climate_altering_land:
            climate_altering_land.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          lifestock_yield:
            lifestock_yield.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

          population_growth:
            population_growth.find(
              d =>
                d.country ===
                  selectedCountry &&
                d.year ===
                  year
            )?.value ?? 0,

        }));

    }, [
      selectedCountry
    ]);


  /* =======================================================
     RANKED DATA
  ======================================================= */

  const rankedData =
    useMemo(() => {

      const economicLossMap =
        new Map<string, number>();

      disasterEconomicLoss.forEach(
        d =>
          economicLossMap.set(
            d.country,
            (
              economicLossMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      const cropYieldMap =
        new Map<string, number>();

      crop_yield.forEach(
        d =>
          cropYieldMap.set(
            d.country,
            (
              cropYieldMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      const touristMap =
        new Map<string, number>();

      tourist_arrival.forEach(
        d =>
          touristMap.set(
            d.country,
            (
              touristMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      const livestockMap =
        new Map<string, number>();

      lifestock_yield.forEach(
        d =>
          livestockMap.set(
            d.country,
            (
              livestockMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      const climateMap =
        new Map<string, number>();

      climate_altering_land.forEach(
        d =>
          climateMap.set(
            d.country,
            (
              climateMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      const populationMap =
        new Map<string, number>();

      population_growth.forEach(
        d =>
          populationMap.set(
            d.country,
            (
              populationMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      const affectedMap =
        new Map<string, number>();

      affectedPersons.forEach(
        d =>
          affectedMap.set(
            d.country,
            (
              affectedMap.get(
                d.country
              ) || 0
            ) + d.value
          )
      );


      return {

        economicLoss:
          Array.from(
            economicLossMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

        cropYield:
          Array.from(
            cropYieldMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

        touristArrivals:
          Array.from(
            touristMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

        livestockYield:
          Array.from(
            livestockMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

        climateAlteringLand:
          Array.from(
            climateMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

        populationGrowth:
          Array.from(
            populationMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

        affectedPersons:
          Array.from(
            affectedMap.entries()
          ).map(
            ([country, value]) => ({
              country,
              value,
            })
          ),

      };

    }, []);


  /* =======================================================
     OTHER DATA
  ======================================================= */

  const multiLineData =
    useMemo(
      () =>
        buildMultiLineData()
          .filter(
            d =>
              d.country ===
              selectedCountry
          ),
      [selectedCountry]
    );


  const beeswarmData =
    useMemo(
      () =>
        buildClimateRecords(),
      []
    );


  /* =======================================================
     DATA FLAGS
  ======================================================= */

  const hasClimateData =
    dataMap.temp.length > 0 ||
    dataMap.sea.length > 0 ||
    dataMap.rainfall.length > 0 ||
    dataMap
      .sea_surface_temperature
      .length > 0;


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
  ======================================================= */

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

    /* ===============================================
       NEW DATA-DRIVEN CLIMATE SIGNAL
    =============================================== */

    climateIndex,

    climateSignal,

    climatePercentile,

    anomalyScores,

    regionalCompositeScores,

  };

}
