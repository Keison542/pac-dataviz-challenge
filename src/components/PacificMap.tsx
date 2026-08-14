"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { geoData } from "@/climatedata/pacificGeoData";
import { affectedPersons } from "@/climatedata/human_consequence/number_of_persons_affected";
import { disasterEconomicLoss } from "@/climatedata/economic_consequence/direct_disaster_economic_loss";
import { seaLevelAnomalies } from "@/climatedata/climate_drivers/sea_level_anomalies";
import { rainfallAnomalies } from "@/climatedata/climate_drivers/rainfall_anomalies";

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS                                   */
/* -------------------------------------------------------------------------- */

const WIDTH = 1400;
const HEIGHT = 700;

const MAP_PADDING = {
  top: 80,
  right: 300,
  bottom: 110,
  left: 40,
};

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type RecordType = {
  country: string;
  value: number;
  year?: number;
};

type Props = {
  data?: {
    economicLoss?: RecordType[];
    cropYield?: RecordType[];
    touristArrivals?: RecordType[];
    livestockYield?: RecordType[];
    climateAlteringLand?: RecordType[];
    populationGrowth?: RecordType[];
    affectedPersons?: RecordType[];

    /*
     * Optional climate-driver datasets.
     *
     * The component does not require these to compile.
     * If your parent already has these datasets, pass them here.
     */
    surfaceTempAnomaly?: RecordType[];
    seaSurfaceTempAnomaly?: RecordType[];
    precipitationAnomaly?: RecordType[];
    seaLevelAnomaly?: RecordType[];
  };

  selectedCountry?: string;
  className?: string;
};

/* -------------------------------------------------------------------------- */
/*                             INDICATOR TYPES                                */
/* -------------------------------------------------------------------------- */

type IndicatorKey =
  | "peopleAffected"
  | "economicLoss"
  | "rainfallAnomaly"
  | "seaLevelAnomaly"
  | "surfaceTemperature"
  | "seaSurfaceTemperature";

type IndicatorConfig = {
  label: string;
  shortLabel: string;
  description: string;
  unit: string;
  color: string;
  direction: "higher" | "signed";
};

const INDICATORS: Record<IndicatorKey, IndicatorConfig> = {
  peopleAffected: {
    label: "People affected",
    shortLabel: "People",
    description:
      "Recorded people affected by natural disasters during the period represented in the dataset.",
    unit: "people",
    color: "#7c3aed",
    direction: "higher",
  },

  economicLoss: {
    label: "Disaster-related economic losses",
    shortLabel: "Economic loss",
    description:
      "Recorded direct economic losses associated with disasters. This indicator is not treated as drought-specific.",
    unit: "USD",
    color: "#ea580c",
    direction: "higher",
  },

  rainfallAnomaly: {
    label: "Rainfall anomaly",
    shortLabel: "Rainfall",
    description:
      "Departure from the rainfall reference period represented in the source data. A rainfall anomaly is not itself a measure of flooding.",
    unit: "mm",
    color: "#2563eb",
    direction: "signed",
  },

  seaLevelAnomaly: {
    label: "Sea-level anomaly",
    shortLabel: "Sea level",
    description:
      "Sea-level departure from the reference level represented in the source data. This is reported as an anomaly rather than cumulative sea-level rise.",
    unit: "m",
    color: "#dc2626",
    direction: "signed",
  },

  surfaceTemperature: {
    label: "Surface temperature anomaly",
    shortLabel: "Surface temperature",
    description:
      "Surface temperature anomaly relative to the reference period represented in the source data.",
    unit: "°C",
    color: "#be123c",
    direction: "signed",
  },

  seaSurfaceTemperature: {
    label: "Sea-surface temperature anomaly",
    shortLabel: "Sea-surface temperature",
    description:
      "Sea-surface temperature anomaly relative to the reference period represented in the source data.",
    unit: "°C",
    color: "#0891b2",
    direction: "signed",
  },
};

/* -------------------------------------------------------------------------- */
/*                              GEO FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

const projectLon = (lon: number) => {
  /*
   * Pacific-centered longitude projection.
   *
   * 120°E → left edge
   * 240°E / 120°W → right edge
   */
  let normalizedLon = lon;

  if (normalizedLon < 120) {
    normalizedLon += 360;
  }

  return (
    MAP_PADDING.left +
    ((normalizedLon - 120) / 120) *
      (WIDTH - MAP_PADDING.left - MAP_PADDING.right)
  );
};

const projectLat = (lat: number) => {
  return (
    HEIGHT -
    MAP_PADDING.bottom -
    ((lat + 35) / 60) *
      (HEIGHT - MAP_PADDING.top - MAP_PADDING.bottom)
  );
};

function flattenCoordinates(
  geometry: any,
  result: number[][] = []
): number[][] {
  if (!geometry) return result;

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring: number[][]) => {
      ring.forEach((coordinate) => result.push(coordinate));
    });
  }

  if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon.forEach((ring: number[][]) => {
        ring.forEach((coordinate) => result.push(coordinate));
      });
    });
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                          COUNTRY CENTROIDS                                 */
/* -------------------------------------------------------------------------- */

function buildCentroids() {
  const grouped = new Map<string, number[][]>();

  geoData.features.forEach((feature: any) => {
    const name = feature.properties?.name;

    if (!name) return;

    const existing = grouped.get(name) || [];

    grouped.set(
      name,
      existing.concat(flattenCoordinates(feature.geometry))
    );
  });

  return Array.from(grouped.entries())
    .map(([name, coordinates]) => {
      if (!coordinates.length) {
        return {
          name,
          lon: 0,
          lat: 0,
        };
      }

      return {
        name,
        lon:
          coordinates.reduce(
            (sum, coordinate) => sum + Number(coordinate[0]),
            0
          ) / coordinates.length,
        lat:
          coordinates.reduce(
            (sum, coordinate) => sum + Number(coordinate[1]),
            0
          ) / coordinates.length,
      };
    })
    .filter(
      (country) =>
        Number.isFinite(country.lon) &&
        Number.isFinite(country.lat)
    );
}

/* -------------------------------------------------------------------------- */
/*                              DATA HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sum values.
 *
 * Used for:
 * - people affected
 * - economic losses
 */
function sumValues(records: RecordType[] = []) {
  return records.reduce((sum, record) => {
    const value = Number(record.value);

    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}

/**
 * Mean values.
 *
 * Used for:
 * - rainfall anomaly
 * - sea-level anomaly
 * - temperature anomalies
 *
 * We deliberately do NOT sum anomalies across years because
 * doing so would make the resulting value difficult to interpret.
 */
function meanValues(records: RecordType[] = []) {
  const values = records
    .map((record) => Number(record.value))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Latest observation.
 *
 * Useful when a climate dataset represents an evolving physical
 * measurement and the most recent value is more meaningful than
 * averaging the whole historical period.
 */
function latestValue(records: RecordType[] = []) {
  if (!records.length) return 0;

  const sorted = [...records].sort((a, b) => {
    const yearA = a.year ?? -Infinity;
    const yearB = b.year ?? -Infinity;

    return yearA - yearB;
  });

  const latest = sorted[sorted.length - 1];

  return Number.isFinite(Number(latest.value))
    ? Number(latest.value)
    : 0;
}

/**
 * Create country lookup from a dataset.
 */
function groupByCountry(records: RecordType[] = []) {
  const lookup = new Map<string, RecordType[]>();

  records.forEach((record) => {
    if (!record?.country) return;

    const existing = lookup.get(record.country) || [];

    existing.push(record);

    lookup.set(record.country, existing);
  });

  return lookup;
}

/* -------------------------------------------------------------------------- */
/*                          INDICATOR VALUE MAP                               */
/* -------------------------------------------------------------------------- */

type CountryIndicatorValues = {
  peopleAffected: number;
  economicLoss: number;
  rainfallAnomaly: number;
  seaLevelAnomaly: number;
  surfaceTemperature: number;
  seaSurfaceTemperature: number;
};

function buildIndicatorData(
  data: Props["data"]
): Map<string, CountryIndicatorValues> {
  const result = new Map<string, CountryIndicatorValues>();

  const datasets: Array<{
    key: keyof CountryIndicatorValues;
    records: RecordType[];
    method: "sum" | "mean" | "latest";
  }> = [
    {
      key: "peopleAffected",
      records:
        data?.affectedPersons && data.affectedPersons.length
          ? data.affectedPersons
          : affectedPersons,
      method: "sum",
    },

    {
      key: "economicLoss",
      records:
        data?.economicLoss && data.economicLoss.length
          ? data.economicLoss
          : disasterEconomicLoss,
      method: "sum",
    },

    {
      key: "rainfallAnomaly",
      records:
        data?.precipitationAnomaly && data.precipitationAnomaly.length
          ? data.precipitationAnomaly
          : rainfallAnomalies,
      method: "mean",
    },

    {
      key: "seaLevelAnomaly",
      records:
        data?.seaLevelAnomaly && data.seaLevelAnomaly.length
          ? data.seaLevelAnomaly
          : seaLevelAnomalies,
      method: "latest",
    },

    {
      key: "surfaceTemperature",
      records: data?.surfaceTempAnomaly || [],
      method: "mean",
    },

    {
      key: "seaSurfaceTemperature",
      records: data?.seaSurfaceTempAnomaly || [],
      method: "mean",
    },
  ];

  datasets.forEach(({ key, records, method }) => {
    const grouped = groupByCountry(records);

    grouped.forEach((countryRecords, country) => {
      const current = result.get(country) || {
        peopleAffected: 0,
        economicLoss: 0,
        rainfallAnomaly: 0,
        seaLevelAnomaly: 0,
        surfaceTemperature: 0,
        seaSurfaceTemperature: 0,
      };

      let value = 0;

      if (method === "sum") {
        value = sumValues(countryRecords);
      }

      if (method === "mean") {
        value = meanValues(countryRecords);
      }

      if (method === "latest") {
        value = latestValue(countryRecords);
      }

      current[key] = value;

      result.set(country, current);
    });
  });

  return result;
}

/* -------------------------------------------------------------------------- */
/*                         FORMATTING FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function formatEconomicLoss(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    return `$${(absolute / 1_000_000_000).toFixed(1)}B`;
  }

  if (absolute >= 1_000_000) {
    return `$${(absolute / 1_000_000).toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    return `$${(absolute / 1_000).toFixed(1)}K`;
  }

  return `$${absolute.toFixed(0)}`;
}

function formatIndicatorValue(
  value: number,
  indicator: IndicatorKey
) {
  switch (indicator) {
    case "peopleAffected":
      return `${formatNumber(value)} people`;

    case "economicLoss":
      return formatEconomicLoss(value);

    case "rainfallAnomaly":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)} mm`;

    case "seaLevelAnomaly":
      return `${value >= 0 ? "+" : ""}${value.toFixed(3)} m`;

    case "surfaceTemperature":
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)} °C`;

    case "seaSurfaceTemperature":
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)} °C`;

    default:
      return value.toFixed(2);
  }
}

/* -------------------------------------------------------------------------- */
/*                         MAIN COMPONENT                                     */
/* -------------------------------------------------------------------------- */

export function PacificClimateStoryMap({
  data,
  selectedCountry,
  className = "",
}: Props) {
  const [activeIndicator, setActiveIndicator] =
    useState<IndicatorKey>("peopleAffected");

  const [hoveredCountry, setHoveredCountry] =
    useState<string | null>(null);

  const [showInstructions, setShowInstructions] =
    useState(true);

  /* ------------------------------------------------------------------------ */
  /*                              DATA                                        */
  /* ------------------------------------------------------------------------ */

  const countries = useMemo(() => buildCentroids(), []);

  const indicatorData = useMemo(
    () => buildIndicatorData(data),
    [data]
  );

  /*
   * Only countries with an actual value for the selected indicator
   * participate in the ranking.
   */
  const rankedCountries = useMemo(() => {
    return countries
      .map((country) => {
        const values = indicatorData.get(country.name);

        const value =
          values?.[activeIndicator] ?? 0;

        return {
          ...country,
          value,
        };
      })
      .filter((country) => Number.isFinite(country.value))
      .sort((a, b) => b.value - a.value);
  }, [countries, indicatorData, activeIndicator]);

  const countriesWithData = useMemo(() => {
    return rankedCountries.filter(
      (country) => Math.abs(country.value) > 0
    );
  }, [rankedCountries]);

  const maximumAbsoluteValue = useMemo(() => {
    if (!countriesWithData.length) return 1;

    return Math.max(
      ...countriesWithData.map((country) =>
        Math.abs(country.value)
      )
    );
  }, [countriesWithData]);

  const regionalMean = useMemo(() => {
    if (!countriesWithData.length) return 0;

    return (
      countriesWithData.reduce(
        (sum, country) => sum + country.value,
        0
      ) / countriesWithData.length
    );
  }, [countriesWithData]);

  const highestCountry = countriesWithData[0] || null;

  /* ------------------------------------------------------------------------ */
  /*                         SELECTED COUNTRY                                 */
  /* ------------------------------------------------------------------------ */

  const selectedCountryValue = useMemo(() => {
    if (!selectedCountry) return null;

    const values = indicatorData.get(selectedCountry);

    if (!values) return null;

    return values[activeIndicator] ?? null;
  }, [
    selectedCountry,
    indicatorData,
    activeIndicator,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                           MAP FUNCTIONS                                  */
  /* ------------------------------------------------------------------------ */

  const getCountryValue = (countryName: string) => {
    const values = indicatorData.get(countryName);

    return values?.[activeIndicator] ?? 0;
  };

  const getCountryRadius = (countryName: string) => {
    const value = getCountryValue(countryName);

    if (!Number.isFinite(value) || value === 0) {
      return 3;
    }

    const normalized =
      Math.abs(value) / maximumAbsoluteValue;

    return 4 + Math.sqrt(Math.min(normalized, 1)) * 18;
  };

  const getCountryOpacity = (countryName: string) => {
    const value = getCountryValue(countryName);

    if (!Number.isFinite(value) || value === 0) {
      return 0.25;
    }

    return 0.95;
  };

  const getCountryColor = () => {
    return INDICATORS[activeIndicator].color;
  };

  /* ------------------------------------------------------------------------ */
  /*                             NARRATIVE                                    */
  /* ------------------------------------------------------------------------ */

  const narrative = useMemo(() => {
    const config = INDICATORS[activeIndicator];

    if (!highestCountry || !countriesWithData.length) {
      return `No ${config.label.toLowerCase()} data are currently available for the countries shown on the map.`;
    }

    const highestValue = formatIndicatorValue(
      highestCountry.value,
      activeIndicator
    );

    const averageValue = formatIndicatorValue(
      regionalMean,
      activeIndicator
    );

    if (activeIndicator === "peopleAffected") {
      return `${highestCountry.name} records the largest number of people affected among the countries represented in this dataset, at ${highestValue}. Across countries with recorded values, the mean is ${averageValue}. The map shows the scale of observed human impacts rather than a composite vulnerability score.`;
    }

    if (activeIndicator === "economicLoss") {
      return `${highestCountry.name} records the largest total direct disaster-related economic loss among the countries represented in this dataset, at ${highestValue}. The regional mean is ${averageValue}. These figures describe recorded economic losses and do not by themselves establish causation or adaptive capacity.`;
    }

    if (activeIndicator === "rainfallAnomaly") {
      return `${highestCountry.name} has the largest positive mean rainfall anomaly among the countries represented in this dataset, at ${highestValue}. The regional mean is ${averageValue}. Rainfall anomaly describes departure from the reference period; it should not automatically be interpreted as flooding or drought damage.`;
    }

    if (activeIndicator === "seaLevelAnomaly") {
      return `${highestCountry.name} has the largest recorded latest sea-level anomaly among the countries represented in this dataset, at ${highestValue}. The regional mean is ${averageValue}. This measure describes an anomaly relative to its reference level rather than cumulative sea-level rise.`;
    }

    if (activeIndicator === "surfaceTemperature") {
      return `${highestCountry.name} has the largest mean surface-temperature anomaly among countries for which this dataset is available, at ${highestValue}. The regional mean is ${averageValue}.`;
    }

    return `${highestCountry.name} has the largest mean sea-surface-temperature anomaly among countries for which this dataset is available, at ${highestValue}. The regional mean is ${averageValue}.`;
  }, [
    activeIndicator,
    highestCountry,
    countriesWithData.length,
    regionalMean,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                              EARLY STATE                                 */
  /* ------------------------------------------------------------------------ */

  const selectedConfig = INDICATORS[activeIndicator];

  /* ------------------------------------------------------------------------ */
  /*                                RENDER                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className={`w-full ${className}`}>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION INTRO                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-4xl text-center mb-8">

        <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-3">
          Regional comparison
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
          The Pacific does not experience climate impacts equally
        </h2>

        <p className="mt-4 text-slate-600 leading-relaxed">
          Climate pressures are regional, but their observed impacts
          vary considerably between countries. Explore the indicators
          below to see how the scale and direction of these measurements
          differ across the Pacific.
        </p>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* INDICATOR SELECTOR                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-wrap justify-center gap-2 mb-6">

        {(Object.keys(INDICATORS) as IndicatorKey[]).map(
          (indicator) => {
            const config = INDICATORS[indicator];
            const active = activeIndicator === indicator;

            /*
             * Temperature indicators are only shown when the parent
             * supplies corresponding data.
             */
            const hasData =
              indicator === "surfaceTemperature"
                ? Boolean(data?.surfaceTempAnomaly?.length)
                : indicator === "seaSurfaceTemperature"
                ? Boolean(
                    data?.seaSurfaceTempAnomaly?.length
                  )
                : true;

            if (!hasData) return null;

            return (
              <button
                key={indicator}
                type="button"
                onClick={() => {
                  setActiveIndicator(indicator);
                  setShowInstructions(false);
                }}
                className={`
                  rounded-full
                  border
                  px-4
                  py-2
                  text-xs
                  font-medium
                  transition-all
                  ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                  }
                `}
              >
                {config.shortLabel}
              </button>
            );
          }
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CURRENT INDICATOR DESCRIPTION                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-3xl text-center mb-6">

        <h3 className="text-lg font-semibold text-slate-900">
          {selectedConfig.label}
        </h3>

        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          {selectedConfig.description}
        </p>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUMMARY CARDS                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8">

        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center"> 
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400"> 
            Highest recorded value
          </div> 

          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {highestCountry
              ? formatIndicatorValue(
                  highestCountry.value,
                  activeIndicator
                )
              : "—"}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {highestCountry?.name || "No country data"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400"> 
            Regional mean
          </div>

          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {countriesWithData.length
              ? formatIndicatorValue(
                  regionalMean,
                  activeIndicator
                )
              : "—"}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Across {countriesWithData.length} countries with data
          </div>
        </div> 

        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Indicator
          </div> 

          <div className="mt-2 text-xl font-semibold text-slate-900">
            {selectedConfig.shortLabel}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {selectedConfig.unit}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAP                                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative w-full overflow-hidden">

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${selectedConfig.label} across Pacific countries`}
        >

          <rect
            width={WIDTH}
            height={HEIGHT}
            fill="transparent"
          />
         
          <text
            x={WIDTH / 2 - 80}
            y={HEIGHT / 2}
            textAnchor="middle"
            fontSize={34}
            fill="#cbd5e1"
            opacity={0.16}
            fontWeight="300"
            letterSpacing="0.15em"
          >
            PACIFIC OCEAN
          </text>

          {/* ------------------------------------------------------------ */}
          {/* COUNTRIES                                                    */}
          {/* ------------------------------------------------------------ */}

          {countries.map((country) => {
            const x = projectLon(country.lon);
            const y = projectLat(country.lat);

            const value = getCountryValue(country.name);

            const hasValue =
              Number.isFinite(value) &&
              Math.abs(value) > 0;

            const radius = getCountryRadius(country.name);

            const isHovered =
              hoveredCountry === country.name;

            const isSelected =
              selectedCountry === country.name;

            return (
              <g
                key={country.name}
                onMouseEnter={() => {
                  setHoveredCountry(country.name);
                }}
                onMouseLeave={() => {
                  setHoveredCountry(null);
                }}
                onClick={() => {
                  setShowInstructions(false);
                }}
                style={{ cursor: "pointer" }}
              >

                {/* ---------------------------------------------------- */}
                {/* COUNTRY CIRCLE                                       */}
                {/* ---------------------------------------------------- */}

                <motion.circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={getCountryColor()}
                  stroke={
                    isSelected
                      ? "#0f172a"
                      : "#ffffff"
                  }
                  strokeWidth={
                    isSelected ? 3 : 1.5
                  }
                  opacity={
                    hasValue
                      ? getCountryOpacity(country.name)
                      : 0.2
                  }
                  animate={{
                    scale: isHovered
                      ? 1.25
                      : 1,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                />

                {/* ---------------------------------------------------- */}
                {/* COUNTRY NAME                                         */}
                {/* ---------------------------------------------------- */}

                <text
                  x={x + radius + 6}
                  y={y + 3}
                  fontSize={9}
                  fontWeight={
                    isSelected || isHovered
                      ? "600"
                      : "400"
                  }
                  fill={
                    isSelected || isHovered
                      ? "#0f172a"
                      : "#64748b"
                  }
                >
                  {country.name}
                </text>

                {/* ---------------------------------------------------- */}
                {/* HOVER DETAIL                                         */}
                {/* ---------------------------------------------------- */}

                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >

                    <rect
                      x={x + radius + 5}
                      y={y + 10}
                      width={175}
                      height={48}
                      rx={5}
                      fill="white"
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />

                    <text
                      x={x + radius + 14}
                      y={y + 27}
                      fontSize={9}
                      fontWeight="600"
                      fill="#0f172a"
                    >
                      {country.name}
                    </text>

                    <text
                      x={x + radius + 14}
                      y={y + 42}
                      fontSize={9}
                      fill="#64748b"
                    >
                      {hasValue
                        ? formatIndicatorValue(
                            value,
                            activeIndicator
                          )
                        : "No recorded value"}
                    </text>

                  </motion.g>
                )}

              </g>
            );
          })}

          {/* ------------------------------------------------------------ */}
          {/* SELECTED COUNTRY ANNOTATION                                 */}
          {/* ------------------------------------------------------------ */}

          {selectedCountry && (
            <g
              transform={`translate(${WIDTH - 270}, 125)`}
            >

              <text
                x={0}
                y={0}
                fontSize={8}
                fontWeight="600"
                fill="#94a3b8"
                letterSpacing="0.12em"
              >
                SELECTED COUNTRY
              </text>

              <text
                x={0}
                y={23}
                fontSize={17}
                fontWeight="600"
                fill="#0f172a"
              >
                {selectedCountry}
              </text>

              <text
                x={0}
                y={45}
                fontSize={10}
                fill="#64748b"
              >
                {selectedConfig.shortLabel}
              </text>

              <text
                x={0}
                y={68}
                fontSize={20}
                fontWeight="600"
                fill={selectedConfig.color}
              >
                {selectedCountryValue !== null
                  ? formatIndicatorValue(
                      selectedCountryValue,
                      activeIndicator
                    )
                  : "No data"}
              </text>

            </g>
          )}

          {/* ------------------------------------------------------------ */}
          {/* HIGHEST COUNTRY ANNOTATION                                  */}
          {/* ------------------------------------------------------------ */}

          {highestCountry && (
            <g
              transform={`translate(${WIDTH - 270}, 285)`}
            >

              <text
                x={0}
                y={0}
                fontSize={8}
                fontWeight="600"
                fill="#94a3b8"
                letterSpacing="0.12em"
              >
                HIGHEST RECORDED VALUE
              </text>

              <text
                x={0}
                y={23}
                fontSize={16}
                fontWeight="600"
                fill="#0f172a"
              >
                {highestCountry.name}
              </text>

              <text
                x={0}
                y={46}
                fontSize={18}
                fontWeight="600"
                fill={selectedConfig.color}
              >
                {formatIndicatorValue(
                  highestCountry.value,
                  activeIndicator
                )}
              </text>

            </g>
          )}

          {/* ------------------------------------------------------------ */}
          {/* MAP FOOTER                                                  */}
          {/* ------------------------------------------------------------ */}

          {/* <text
            x={MAP_PADDING.left}
            y={HEIGHT - 35}
            fontSize={9}
            fill="#94a3b8"
          >
            Values are displayed using the aggregation appropriate to
            each indicator.
          </text> */}

        </svg>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* INTERPRETATION                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-4xl mt-8">

        {/* <div className="border-l-2 border-slate-200 pl-5"> */}
        <div>

          <p className="text-slate-600 leading-relaxed">
            {narrative}
          </p>

        </div>

      </div>


      <p className="mx-auto max-w-3xl text-center text-sm text-slate-500 mt-6 leading-relaxed">
        Fig. 6: Observed climate-related indicators and impacts across
        Pacific countries. Select an indicator to compare the relative
        magnitude of recorded values between countries.
      </p>

    </div>
  );
}

export default PacificClimateStoryMap;
