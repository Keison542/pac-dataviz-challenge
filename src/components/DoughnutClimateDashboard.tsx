"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DoughnutClimateDashboardProps {
  kpis: any;
  deltas?: any;
  selectedCountry: string;
  isLoading?: boolean;

  // =====================================================
  // DATA-DRIVEN CLIMATE VALUES FROM useClimateData()
  // =====================================================
  climateIndex?: number;
  climateSignal?: {
    label: string;
    level: string;
    percentile: number;
  };

  anomalyScores?: {
    temp: number;
    rainfall: number;
    sea: number;
    sea_surface_temperature: number;
  };
}


/* =========================================================
   METADATA
========================================================= */

const metricMeta = {
  temp: {
    label: "Air Temperature",
    color: "#f97316",
  },

  sea_surface_temperature: {
    label: "Sea Surface Temp",
    color: "#0ea5e9",
  },

  rainfall: {
    label: "Rainfall Anomaly",
    color: "#06b6d4",
  },

  sea: {
    label: "Sea Level Rise",
    color: "#2563eb",
  },
};


/* =========================================================
   SIGNAL STYLING
========================================================= */

const getSignalStyle = (level: string) => {

  switch (level) {

    case "very-high":
      return {
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      };

    case "high":
      return {
        text: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
      };

    case "moderate":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };

    default:
      return {
        text: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
      };

  }

};


/* =========================================================
   COMPONENT
========================================================= */

export function DoughnutClimateDashboard({

  kpis,

  deltas,

  selectedCountry,

  isLoading,

  climateIndex: suppliedClimateIndex,

  climateSignal: suppliedClimateSignal,

  anomalyScores: suppliedAnomalyScores,

}: DoughnutClimateDashboardProps) {


  /* =======================================================
     LOCAL STATE
  ======================================================= */

  const [
    activeMetric,
    setActiveMetric
  ] = useState<string | null>(null);

  const [
    shock,
    setShock
  ] = useState(false);


  /* =======================================================
     SAFE DATA
  ======================================================= */

  const safeKpis = kpis ?? {};


  /*
   * These values are produced by useClimateData().
   *
   * The fallbacks prevent the dashboard from crashing
   * during the first render while data is being prepared.
   */

  const climateIndex =
    Number.isFinite(
      suppliedClimateIndex
    )
      ? suppliedClimateIndex!
      : 0;


  const climateSignal =
    suppliedClimateSignal ?? {
      label: "Lower Regional Signal",
      level: "lower",
      percentile: 0,
    };


  const anomalyScores =
    suppliedAnomalyScores ?? {
      temp: 0,
      rainfall: 0,
      sea: 0,
      sea_surface_temperature: 0,
    };


  /* =======================================================
     SIGNAL STYLE
  ======================================================= */

  const signalStyle =
    getSignalStyle(
      climateSignal.level
    );


  /* =======================================================
     SHOCK EFFECT
     
     This is now triggered by the DATA-DRIVEN signal
     rather than a hard-coded climateIndex > 70 rule.
  ======================================================= */

  useEffect(() => {

    if (
      climateSignal.level === "very-high"
    ) {

      setShock(true);

      const timer =
        setTimeout(
          () => setShock(false),
          600
        );

      return () =>
        clearTimeout(timer);
    }

    setShock(false);

  }, [
    climateSignal.level
  ]);


  /* =======================================================
     METRICS
  ======================================================= */

  const metrics = useMemo(() => [

    {
      key: "temp",
      value:
        Number(
          safeKpis.temp ?? 0
        ),
      score:
        anomalyScores.temp,
    },

    {
      key: "sea_surface_temperature",
      value:
        Number(
          safeKpis.sea_surface_temperature ?? 0
        ),
      score:
        anomalyScores.sea_surface_temperature,
    },

    {
      key: "rainfall",
      value:
        Number(
          safeKpis.rainfall ?? 0
        ),
      score:
        anomalyScores.rainfall,
    },

    {
      key: "sea",
      value:
        Number(
          safeKpis.sea ?? 0
        ),
      score:
        anomalyScores.sea,
    },

  ], [
    safeKpis,
    anomalyScores,
  ]);


  /* =======================================================
     DATA AVAILABILITY
  ======================================================= */

  const hasData =
    metrics.some(
      metric =>
        Math.abs(metric.value) >
        0.01
    );


  /*
   * Do not render an empty dashboard.
   */

  if (
    isLoading ||
    !hasData
  ) {
    return null;
  }


  /* =======================================================
     METRIC CIRCLE
  ======================================================= */

  const MetricCircle = ({
    m,
  }: {
    m: {
      key: string;
      value: number;
      score: number;
    };
  }) => {

    const meta =
      metricMeta[
        m.key as keyof typeof metricMeta
      ];


    const score =
      Math.max(
        0,
        Math.min(
          100,
          Number(m.score) || 0
        )
      );


    const circumference =
      2 *
      Math.PI *
      18;


    const dashOffset =
      circumference *
      (1 - score / 100);


    return (

      <motion.div

        whileHover={{
          scale: 1.04,
        }}

        onMouseEnter={() =>
          setActiveMetric(m.key)
        }

        onMouseLeave={() =>
          setActiveMetric(null)
        }

        className="
          flex
          items-center
          gap-3
          cursor-pointer
        "
      >

        {/* =============================================
            CIRCLE
        ============================================= */}

        <div className="
          relative
          w-12
          h-12
          flex-shrink-0
        ">

          <svg
            className="
              w-12
              h-12
              transform
              -rotate-90
            "
            viewBox="0 0 48 48"
          >

            {/* Background circle */}

            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3.5"
            />


            {/* Data-driven anomaly intensity */}

            <motion.circle

              cx="24"
              cy="24"
              r="18"

              fill="none"

              stroke={
                meta.color
              }

              strokeWidth="4"

              strokeLinecap="round"

              strokeDasharray={
                circumference
              }

              initial={{
                strokeDashoffset:
                  circumference,
              }}

              animate={{
                strokeDashoffset:
                  dashOffset,
              }}

              transition={{
                duration: 0.7,
                ease: "easeOut",
              }}

            />

          </svg>


          {/* Value */}

          <div className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            text-[10px]
            font-bold
            text-slate-700
          ">

            {Number.isFinite(m.value)
              ? m.value.toFixed(1)
              : "0.0"}

          </div>

        </div>


        {/* =============================================
            LABEL
        ============================================= */}

        <div>

          <div className="
            text-xs
            font-medium
            text-slate-700
          ">

            {meta.label}

          </div>


          <div className="
            text-[10px]
            text-slate-400
            mt-0.5
          ">

            {score.toFixed(0)}
            % relative anomaly intensity

          </div>


          {/* Hover detail */}

          <AnimatePresence>

            {activeMetric === m.key && (

              <motion.div

                initial={{
                  opacity: 0,
                  y: 3,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

                exit={{
                  opacity: 0,
                  y: 3,
                }}

                className="
                  text-[9px]
                  text-slate-500
                  mt-1
                "
              >

                Relative to observed
                Pacific data range

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </motion.div>

    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <motion.div

      animate={{
        backgroundColor:
          shock
            ? "rgba(239, 68, 68, 0.04)"
            : "transparent",
      }}

      transition={{
        duration: 0.3,
      }}

      className="
        w-full
        max-w-6xl
        mx-auto
        mb-12
        rounded-xl
      "
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="
        text-center
        mb-8
      ">


        {/* ===============================================
            EXPLANATORY TEXT
        =============================================== */}

        <p className="
          mx-auto
          max-w-3xl
          text-center
          text-slate-600
          leading-relaxed
        ">

          Let's begin with the numbers to understand
          the scale of climate-related consequences.
          Numbers rarely tell the whole story, but they
          provide a clear signal of changing climate
          pressures across the Pacific. This signal
          combines the latest observed values for
          temperature, rainfall, sea surface temperature,
          and sea level for{" "}

          <strong className="text-slate-800">
            {selectedCountry}
          </strong>

          {" "}and compares their relative intensity
          with the observed Pacific-wide data.

        </p>


        {/* ===============================================
            INDEX
        =============================================== */}

        <div className="
          flex
          flex-col
          sm:flex-row
          items-center
          justify-center
          gap-3
          mt-5
        ">


          <AnimatePresence
            mode="wait"
          >

            <motion.div

              key={climateIndex}

              initial={{
                opacity: 0,
                scale: 0.8,
                y: 10,
              }}

              animate={{
                opacity: 1,
                scale:
                  shock
                    ? 1.15
                    : 1,
                color:
                  shock
                    ? "#dc2626"
                    : "#0f172a",
              }}

              transition={{
                duration: 0.4,
              }}

              className="
                text-5xl
                font-bold
                leading-none
              "
            >

              {climateIndex}

            </motion.div>

          </AnimatePresence>


          {/* =============================================
              SIGNAL
          ============================================= */}

          <div
            className={`
              px-3
              py-1.5
              rounded-full
              border
              text-sm
              font-semibold
              ${signalStyle.text}
              ${signalStyle.bg}
              ${signalStyle.border}
            `}
          >

            {climateSignal.label}

          </div>

        </div>


        {/* ===============================================
            PERCENTILE CONTEXT
        =============================================== */}

        <div className="
          mt-3
          text-xs
          text-slate-500
          max-w-xl
          mx-auto
        ">

          {climateSignal.percentile > 0 ? (

            <>
              This country's combined climate signal
              is higher than approximately{" "}

              <strong className="text-slate-700">
                {climateSignal.percentile}%
              </strong>

              {" "}of countries represented in the
              observed Pacific dataset.
            </>

          ) : (

            <>
              Relative climate signal calculated from
              the observed Pacific dataset.
            </>

          )}

        </div>


        {/* ===============================================
            INDEX BAR
        =============================================== */}

        <div className="
          w-full
          max-w-xs
          mx-auto
          mt-4
          h-2
          bg-slate-200
          rounded-full
          overflow-hidden
        ">

          <motion.div

            className="
              h-full
              bg-gradient-to-r
              from-blue-400
              via-orange-400
              to-red-500
            "

            initial={{
              width: "0%",
            }}

            animate={{
              width:
                `${Math.min(
                  100,
                  Math.max(
                    0,
                    climateIndex
                  )
                )}%`,
            }}

            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}

          />

        </div>


        {/* ===============================================
            METHODOLOGY LABEL
        =============================================== */}

        <div className="
          mt-2
          text-[10px]
          uppercase
          tracking-widest
          text-slate-400
        ">

          Relative climate signal · observed Pacific range

        </div>


        {/* ===============================================
            SIGNAL DETECTION
        =============================================== */}

        <div className="
          text-sm
          font-semibold
          mt-6
          tracking-wide
        ">

          SIGNAL DETECTION ·{" "}

          <span className="text-slate-900">
            {selectedCountry}
          </span>

        </div>

      </div>


      {/* ===================================================
          METRICS
      =================================================== */}

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-4
        gap-6
        px-2
      ">

        {metrics.map(
          (metric) => (

            <MetricCircle
              key={metric.key}
              m={metric}
            />

          )
        )}

      </div>


      {/* ===================================================
          INTERPRETATION
      =================================================== */}

      <div className="
        mt-8
        mx-auto
        max-w-3xl
        text-center
      ">

        <p className="
          text-sm
          text-slate-600
          leading-relaxed
        ">

          The climate signal should be interpreted
          comparatively rather than as a direct measure
          of physical risk. A higher score indicates that
          the latest observed climate anomalies for{" "}

          <strong className="text-slate-800">
            {selectedCountry}
          </strong>

          {" "}are relatively intense compared with the
          observed range across the Pacific dataset.

        </p>

      </div>


      {/* ===================================================
          CLIMATE CONSEQUENCE CONTEXT
      =================================================== */}

      <div className="
        mt-5
        mx-auto
        max-w-3xl
        text-center
      ">

        <p className="
          text-sm
          text-slate-600
          leading-relaxed
        ">

          A measurable climate signal is emerging.
          Across the Pacific, climate events such as
          flooding, coral erosion, heavy rainfall, and
          El Niño conditions can influence weather patterns
          and livelihoods. The question is whether these
          changes represent the early signs of a larger shift.

        </p>

      </div>

    </motion.div>

  );

}
