"use client";

import { useState } from "react";
// import { PacificClimateStoryMap } from "@/components/PacificMap";

interface HeroProps {
  countries: string[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

const CountryPill = ({ label, active, onClick }: any) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "0.45rem 1.1rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: active ? 600 : 400,
        backgroundColor: active ? "#0f172a" : hover ? "#f1f5f9" : "white",
        color: active ? "white" : "#334155",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
};

export function Hero({
  countries,
  selectedCountry,
  onSelectCountry,
}: HeroProps) {
  return (
    <div className="relative text-center mb-16 z-10">

      {/* =========================
          CONTEXT LABEL (UNCHANGED)
      ========================== */}
      <div className="text-[0.7rem] tracking-[0.2em] uppercase text-cyan-600 mb-6">
        Pacific Climate Observatory · Data Story 1850–2025
      </div>

      {/* =========================
          TITLE (STRENGTHENED HOOK)
      ========================== */}
      <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-tight text-slate-900 max-w-4xl mx-auto">
      Climate change is not experienced equally across the Pacific.
      </h1>

      {/* =========================
          WINNING THESIS (KEY FIX)
      ========================== */}
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed">
        The region contributes little to global emissions, yet faces some of the world's highest climate risks.
      </p>

      {/* =========================
          STORY DIRECTION (NEW — IMPORTANT)
      ========================== */}
      <div className="mt-6 text-sm text-slate-500 max-w-xl mx-auto">
      This story follows how climate pressures become economic losses, human disruption, and unequal vulnerability across Pacific Island nations.
      </div>

      {/* =========================
          SCROLL CUE (REFINED)
      ========================== */}
      <div className="mt-8 text-sm text-slate-400 animate-pulse">
        Follow the system: climate → economy → inequality → impact ↓
      </div>

      {/* =========================
          COUNTRY SELECTION
      ========================== */}
      <div className="mt-10">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-3">
          Select a country
        </div>

        <div className="flex flex-wrap gap-2 justify-center max-h-[140px] overflow-y-auto px-2">
          {countries.map((c) => (
            <CountryPill
              key={c}
              label={c}
              active={c === selectedCountry}
              onClick={() => onSelectCountry(c)}
            />
          ))}
        </div>
      </div>

      {/* =========================
          MAP - NO WRAPPER, NO CARD STYLING
      ========================== */}
      {/* <div className="mt-12 w-full">
        <PacificClimateStoryMap />
      </div> */}

      {/* =========================
          DATA SOURCES (SIMPLIFIED = BETTER FOR JUDGES)
      ========================== */}
      <div className="mt-12">
        <details className="text-xs text-slate-400 max-w-3xl mx-auto">
          <summary className="cursor-pointer hover:text-slate-600 transition">
            Data sources & methodology
          </summary>

          <div className="mt-4 text-slate-500 leading-relaxed space-y-3">

            <p>
              This visualization uses open datasets from the Pacific Data Hub,
              covering climate trends, economic indicators, and population impacts.
            </p>

           <div className="flex flex-wrap gap-3 justify-center text-[11px]">
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SST_ANOM.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Sea Surface Temp
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.RAIN_ANOM.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Rainfall
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SEA_LVL.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Sea Level
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ST_ANOM.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Surface Temp
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AFFCT.........&pd=,&to[TIME_PERIOD]=false&lb=bt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Affected Persons
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AALT...._T.....&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Economic Loss
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ALT_LAND_COVER.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Land Cover
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.LVST_YIELD.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Livestock
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.CROP_YIELD.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Crop Yield
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?tm=population%20growth&pg=0&snb=11&df[ds]=ds%3ASPC2&df[id]=DF_NMDI_POP&df[ag]=SPC&df[vs]=1.0&dq=A..NMDI0002._T._T._T..&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Population
            </a>
          
            <a
              href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.TRSM_ARR.&pd=,&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600"
            >
              Tourism
            </a>
          </div>

            <p className="text-[10px] text-slate-400 mt-2">
              All visualizations are derived from publicly available datasets.
            </p>

          </div>
        </details>
      </div>

    </div>
  );
}
