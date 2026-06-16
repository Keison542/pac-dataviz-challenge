"use client";
import { useState } from "react";

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
          CONTEXT LABEL
      ========================== */}
      <div className="text-[0.7rem] tracking-[0.2em] uppercase text-cyan-600 mb-6">
        Pacific Climate Observatory · Data Story 1850–2025
      </div>

      {/* =========================
          TITLE
      ========================== */}
      <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-tight text-slate-900 max-w-4xl mx-auto">
        The Pacific is entering a
        <span className="text-cyan-600"> climate cascade</span>
      </h1>

      {/* =========================
          STORY HOOK
      ========================== */}
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed">
        A connected chain of rising temperatures, rising seas, ecosystem stress,
        and economic pressure across Pacific Island nations.
      </p>

      {/* =========================
          SCROLL CUE
      ========================== */}
      <div className="mt-8 text-sm text-slate-400 animate-pulse">
        Scroll to explore the system ↓
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
          DATA SOURCES (FIXED — IMPORTANT)
      ========================== */}
      <div className="mt-12">
        <details className="text-xs text-slate-400 max-w-3xl mx-auto">
          <summary className="cursor-pointer hover:text-slate-600 transition">
            View data sources & methodology
          </summary>

          <div className="mt-4 text-slate-500 leading-relaxed space-y-3">

            <p>
              Official datasets from the Pacific Data Hub (SPC) covering climate,
              environment, population, and socio-economic indicators (1850–2025).
            </p>

            <div className="flex flex-wrap gap-3 justify-center text-[11px]">
              <a className="hover:text-cyan-600" href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE">
                Sea Surface Temperature
              </a>

              <a className="hover:text-cyan-600" href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE">
                Rainfall Data
              </a>

              <a className="hover:text-cyan-600" href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE">
                Sea Level Data
              </a>

              <a className="hover:text-cyan-600" href="https://stats.pacificdata.org">
                Economic & Population Data
              </a>

              <a className="hover:text-cyan-600" href="https://stats.pacificdata.org">
                Agriculture Indicators
              </a>
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              Note: All visualisations are derived from publicly available open datasets.
            </p>

          </div>
        </details>
      </div>

    </div>
  );
}
