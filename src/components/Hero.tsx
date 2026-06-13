"use client";
import { useState } from "react";

interface HeroProps {
  countries: string[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

const CountryPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  return (
    <button 
      onClick={onClick} 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)} 
      style={{
        display: "inline-flex",
        padding: "0.4rem 1.2rem",
        borderRadius: "2rem",
        fontSize: "0.8rem",
        fontWeight: active ? 600 : 400,
        backgroundColor: active ? "#0f172a" : hover ? "#f8fafc" : "#ffffff",
        color: active ? "#ffffff" : "#334155",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
};

export function Hero({ countries, selectedCountry, onSelectCountry }: HeroProps) {
  return (
    <div className="text-center mb-12 relative z-10">
      <div className="text-[0.7rem] font-bold tracking-[0.15em] uppercase text-[#D85A30] mb-4">
        Pacific Community · SPC NMDI Data Platform
      </div>
      <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] mb-4 text-slate-900 leading-tight">
        The Pacific Climate Cascade
      </h1>
      <p className="text-[1.1rem] text-slate-600 max-w-[680px] mx-auto leading-relaxed">
        From rising temperatures to rising seas, from extreme rain to devastated communities — 
        follow the chain of climate impacts across 20+ Pacific Island nations and territories.
      </p>
      
      {/* Country Selector Pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-8 max-h-[180px] overflow-y-auto p-2">
        {countries.map(c => (
          <CountryPill 
            key={c} 
            label={c} 
            active={c === selectedCountry} 
            onClick={() => onSelectCountry(c)} 
          />
        ))}
      </div>

      {/* Data Sources Links */}
      <div className="text-[0.7rem] text-slate-400 mt-4">
        <div className="mb-1">📊 Official datasets from <span className="font-semibold">Pacific Data Hub from 1850–2025 (175+ years of climate data)</span>:</div>
        <div className="flex flex-wrap gap-2 justify-center">
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SST_ANOM.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">🌊 Sea Surface Temperature</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.RAIN_ANOM.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">☔ Rainfall Data</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SEA_LVL.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">📈 Sea Level Data</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ST_ANOM.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">🌡️ Surface Temperature</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AFFCT.........&pd=,&to[TIME_PERIOD]=false&lb=bt" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">👥 Affected Persons</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AALT...._T.....&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">💰 Economic Loss</a>
         <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ALT_LAND_COVER.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">🌱 Land Degradation</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.LVST_YIELD.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition"> 🐄 Livestock Yield</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.CROP_YIELD.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition"> 🌾 Crop Yield</a>
          <a href="https://stats.pacificdata.org/vis?tm=population%20growth&pg=0&snb=11&df[ds]=ds%3ASPC2&df[id]=DF_NMDI_POP&df[ag]=SPC&df[vs]=1.0&dq=A..NMDI0002._T._T._T..&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition"> 🕒 Population Growth</a>
          <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.TRSM_ARR.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition"> 🌴 Tourist Arrivals</a>
        </div>
      </div>
    </div>
  );
}