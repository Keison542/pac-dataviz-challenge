"use client";

import { useMemo, useState, useEffect } from "react";

type Props = {
  width: number;
  height: number;

  
  // Human Impacts

  tuberculosisIncidence: number;
  // Economic
  cropYield: number;
  livestockYield: number;
 
  touristArrivals: number;
  countryName: string;
};

export function LivingEcosystem({
  width,
  height,
  
  tuberculosisIncidence,
  cropYield,
  livestockYield,
  
  touristArrivals,
  countryName,
}: Props) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "sunset" | "night">("day");
  const [raindrops, setRaindrops] = useState<Array<{ id: number; x: number; delay: number; speed: number }>>([]);

  // Normalize values
  const norms = useMemo(() => ({
    seaLevel: Math.min(1, Math.max(0, (seaLevelAnomaly + 0.2) / 0.7)),
    surfaceTemp: Math.min(1, Math.max(0, (surfaceTempAnomaly + 1) / 4)),
    seaSurfaceTemp: Math.min(1, Math.max(0, (seaSurfaceTemp + 1) / 4)),
    rainfall: Math.min(1, Math.max(0, (rainfallAnomaly + 100) / 300)),
    peopleAffected: Math.min(1, peopleAffected / 100000),
    tuberculosis: Math.min(1, tuberculosisIncidence / 500),
    cropYield: Math.min(1, cropYield / 10),
    livestockYield: Math.min(1, livestockYield / 20),
    economicLoss: Math.min(1, economicLoss / 100000000),
    touristArrivals: Math.min(1, touristArrivals / 1000000),
  }), [seaLevelAnomaly, surfaceTempAnomaly, seaSurfaceTemp, rainfallAnomaly, peopleAffected, tuberculosisIncidence, cropYield, livestockYield, economicLoss, touristArrivals]);

  // Generate raindrops based on rainfall intensity
  useEffect(() => {
    const dropCount = Math.floor(30 + norms.rainfall * 70);
    const newDrops = Array.from({ length: dropCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      speed: 0.3 + Math.random() * 0.5,
    }));
    setRaindrops(newDrops);
  }, [norms.rainfall]);

  // Update time of day
  useEffect(() => {
    if (norms.surfaceTemp < 0.3) setTimeOfDay("night");
    else if (norms.surfaceTemp < 0.6) setTimeOfDay("sunset");
    else setTimeOfDay("day");
  }, [norms.surfaceTemp]);

  // Visual properties
  const skyGradient = {
    day: "linear-gradient(180deg, #1e3a5f 0%, #3b82f6 40%, #7dd3fc 100%)",
    sunset: "linear-gradient(180deg, #78350f 0%, #b45309 40%, #fbbf24 100%)",
    night: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)"
  }[timeOfDay];

  const oceanColor = norms.seaLevel < 0.3 ? "#0891b2"
    : norms.seaLevel < 0.6 ? "#0284c7"
    : "#1e3a8a";

  const frondColor = norms.seaSurfaceTemp < 0.3 ? "#22c55e"
    : norms.seaSurfaceTemp < 0.6 ? "#eab308"
    : "#ef4444";

  const trunkRotate = -10 + norms.peopleAffected * 20;
  const trunkWidthVal = Math.max(12, 24 - norms.tuberculosis * 12);
  const coconutCount = Math.max(3, Math.floor(4 + norms.cropYield * 10));
  const grassHeightVal = 10 + norms.livestockYield * 30;
  const frondDamage = norms.economicLoss > 0.25;
  const beachColor = norms.touristArrivals < 0.3 ? "#fcd34d"
    : norms.touristArrivals < 0.6 ? "#b45309"
    : "#78350f";
  
  const rainOpacity = 0.1 + norms.rainfall * 0.7;
  const sunSize = 40 + norms.surfaceTemp * 50;
  const sunGlow = 20 + norms.surfaceTemp * 40;

  // Wave intensity for ocean
  const waveIntensity = 0.2 + norms.seaLevel * 0.6;

  // Falling leaf particles for economic loss
  const fallingLeaves = useMemo(() => {
    if (!frondDamage) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 45 + Math.random() * 10,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
  }, [frondDamage]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto" style={{ width, height, background: "#0a0a2a" }}>
      
      {/* Stars (Night only) - Twinkling animation */}
      {timeOfDay === "night" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 45}%`,
                opacity: Math.random() * 0.6,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* SKY - HOVERABLE with heat shimmer */}
      <div 
        className="absolute top-0 left-0 w-full h-1/2 transition-all duration-1000 cursor-pointer"
        style={{ 
          background: skyGradient,
          animation: norms.surfaceTemp > 0.7 ? `heatShimmer 0.5s ease-in-out infinite` : 'none'
        }}
        onMouseEnter={() => setHoveredElement("sky")}
        onMouseLeave={() => setHoveredElement(null)}
      />

      {/* SUN - Pulsing animation for heat */}
      <div
        className="absolute rounded-full transition-all duration-1000 cursor-pointer"
        style={{
          right: 50,
          top: 40,
          width: sunSize,
          height: sunSize,
          background: `radial-gradient(circle at 35% 35%, #fef08a, ${timeOfDay === "day" ? '#f59e0b' : '#ea580c'})`,
          opacity: timeOfDay === "night" ? 0 : 1,
          boxShadow: `0 0 ${sunGlow}px rgba(245, 158, 11, 0.5)`,
          animation: norms.surfaceTemp > 0.5 ? `pulse ${1 + norms.surfaceTemp}s ease-in-out infinite` : 'none',
        }}
        onMouseEnter={() => setHoveredElement("sun")}
        onMouseLeave={() => setHoveredElement(null)}
      />

      {/* Sun rays */}
      {timeOfDay !== "night" && norms.surfaceTemp > 0.5 && (
        <div className="absolute right-16 top-16 w-32 h-32 pointer-events-none" style={{ animation: `spin 12s linear infinite` }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-12 bg-yellow-400/30 rounded-full"
              style={{
                left: "50%",
                top: "50%",
                transform: `rotate(${i * 45}deg) translateY(-30px)`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>
      )}

      {/* OCEAN - Animated waves */}
      <div 
        className="absolute bottom-0 left-0 w-full transition-all duration-1000 cursor-pointer"
        style={{ height: "42%", background: oceanColor }}
        onMouseEnter={() => setHoveredElement("ocean")}
        onMouseLeave={() => setHoveredElement(null)}
      />

      {/* OCEAN WAVES - Moving waves */}
      <div 
        className="absolute bottom-0 left-0 w-full overflow-hidden cursor-pointer"
        style={{ height: "42%" }}
        onMouseEnter={() => setHoveredElement("ocean")}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="absolute bottom-0 w-full"
            style={{ opacity: waveIntensity, bottom: i * 8 }}
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
          >
            <path
              d={`M0,40 C150,60 350,20 600,40 C850,60 1050,20 1200,40 L1200,80 L0,80 Z`}
              fill="rgba(255,255,255,0.25)"
            >
              <animate 
                attributeName="d" 
                dur={`${3 + i}s`} 
                repeatCount="indefinite" 
                values={`
                  M0,40 C150,60 350,20 600,40 C850,60 1050,20 1200,40 L1200,80 L0,80 Z;
                  M0,40 C150,20 350,60 600,40 C850,20 1050,60 1200,40 L1200,80 L0,80 Z;
                  M0,40 C150,60 350,20 600,40 C850,60 1050,20 1200,40 L1200,80 L0,80 Z
                `}
              />
            </path>
          </svg>
        ))}
      </div>

      {/* BEACH/GROUND */}
      <div
        className="absolute rounded-full transition-all duration-700 cursor-pointer"
        style={{
          bottom: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 340,
          height: 110,
          background: `radial-gradient(ellipse at 30% 40%, ${beachColor}, #78350f)`,
          boxShadow: "inset 0 5px 20px rgba(0,0,0,0.2), 0 -5px 15px rgba(255,255,255,0.1)",
        }}
        onMouseEnter={() => setHoveredElement("beach")}
        onMouseLeave={() => setHoveredElement(null)}
      />

      {/* GRASS - Swaying animation */}
      <div 
        className="absolute cursor-pointer" 
        style={{ bottom: "38%", left: "50%", transform: "translateX(-50%)", width: 300 }}
        onMouseEnter={() => setHoveredElement("grass")}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full transition-all duration-500"
            style={{
              bottom: 0,
              left: i * 9 + Math.sin(i) * 8,
              width: 2.5,
              height: grassHeightVal * (0.5 + Math.random() * 0.7),
              background: `linear-gradient(180deg, ${norms.livestockYield > 0.6 ? '#4ade80' : '#fbbf24'}, ${norms.livestockYield > 0.6 ? '#22c55e' : '#f59e0b'})`,
              opacity: 0.8,
              transform: `rotate(${(Math.sin(i) * 20)}deg)`,
              transformOrigin: "bottom center",
              animation: `sway ${3 + Math.sin(i) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* TREE TRUNK */}
      <div
        className="absolute rounded-lg transition-all duration-700 cursor-pointer"
        style={{
          bottom: "38%",
          left: "50%",
          transform: `translateX(-50%) rotate(${trunkRotate}deg)`,
          width: trunkWidthVal,
          height: 170,
          background: `linear-gradient(90deg, #78350f, ${norms.tuberculosis > 0.5 ? '#64748b' : '#92400e'}, #78350f)`,
          transformOrigin: "bottom center",
          borderRadius: "25px 25px 10px 10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          zIndex: 5,
        }}
        onMouseEnter={() => setHoveredElement("trunk")}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {/* Bark texture lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-black/15 rounded-full"
            style={{ left: i * 3, width: 1.5, height: "100%" }}
          />
        ))}
      </div>

      {/* FRONDS - Swaying animation */}
      <div
        className="absolute transition-all duration-700"
        style={{
          bottom: "38%",
          left: "50%",
          transform: `translateX(-50%) translateY(-170px) rotate(${trunkRotate}deg)`,
          zIndex: 10,
        }}
        onMouseEnter={() => setHoveredElement("fronds")}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {[
          { angle: -65, length: 90, delay: 0 },
          { angle: -45, length: 110, delay: 0.15 },
          { angle: -25, length: 105, delay: 0.25 },
          { angle: -5, length: 100, delay: 0.3 },
          { angle: 15, length: 105, delay: 0.25 },
          { angle: 35, length: 110, delay: 0.15 },
          { angle: 55, length: 95, delay: 0 },
        ].map((frond, idx) => {
          const isDamaged = frondDamage && (idx === 1 || idx === 4 || idx === 5);
          return (
            <div
              key={idx}
              className="absolute rounded-full transition-all duration-500"
              style={{
                width: frond.length,
                height: 10,
                background: `linear-gradient(90deg, ${frondColor}, ${isDamaged ? '#dc2626' : '#22c55e'})`,
                transform: `rotate(${frond.angle}deg)`,
                transformOrigin: "left center",
                opacity: isDamaged ? 0.5 : 0.9,
                boxShadow: isDamaged ? "none" : "0 2px 8px rgba(0,0,0,0.15)",
                top: -12,
                left: 0,
                borderRadius: "0 25px 25px 0",
                animation: `sway ${4 + idx}s ease-in-out infinite`,
                animationDelay: `${frond.delay}s`,
              }}
            >
              {isDamaged && (
                <div className="absolute -right-3 top-0 w-6 h-10 bg-red-700 rounded-full opacity-80 rotate-12" />
              )}
            </div>
          );
        })}
      </div>

      {/* FALLING LEAVES - Economic loss animation */}
      {fallingLeaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute w-3 h-3 bg-red-600/60 rounded-sm pointer-events-none"
          style={{
            left: `${leaf.x}%`,
            top: -20,
            animation: `fall ${leaf.duration}s linear infinite`,
            animationDelay: `${leaf.delay}s`,
          }}
        />
      ))}

      {/* COCONUTS - Floating animation */}
      <div
        className="absolute transition-all duration-700"
        style={{
          bottom: "38%",
          left: "50%",
          transform: `translateX(-50%) translateY(-170px) rotate(${trunkRotate}deg)`,
          zIndex: 15,
        }}
      >
        {[...Array(coconutCount)].map((_, i) => {
          const angle = (i / coconutCount) * Math.PI * 2;
          const radius = 28 + (i % 3) * 10;
          const xOffset = 10 + Math.cos(angle) * radius;
          const yOffset = -15 + Math.sin(angle) * radius;
          return (
            <div
              key={i}
              className="absolute transition-all duration-500 hover:scale-125 cursor-pointer group"
              style={{
                left: xOffset,
                top: yOffset,
                width: 20,
                height: 24,
                background: "radial-gradient(ellipse at 35% 35%, #8B5E3C, #5C3A1E)",
                borderRadius: "50% 50% 45% 45%",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                animation: `float ${2 + i * 0.2}s ease-in-out infinite`,
              }}
              onMouseEnter={() => setHoveredElement("coconut")}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-yellow-800/60 rounded-full" />
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-800/60 rounded-full" />
            </div>
          );
        })}
      </div>

      {/* RAIN - Falling raindrops animation */}
      <div 
        className="absolute top-0 left-0 w-full h-1/2 overflow-hidden pointer-events-auto cursor-pointer"
        onMouseEnter={() => setHoveredElement("rain")}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {raindrops.map((drop) => (
          <div
            key={drop.id}
            className="absolute bg-cyan-300 rounded-full"
            style={{
              left: `${drop.x}%`,
              top: -20,
              width: 2,
              height: 12,
              opacity: rainOpacity * 0.8,
              animation: `rain ${drop.speed}s linear infinite`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Water splash effects for heavy rain */}
      {norms.rainfall > 0.7 && (
        <div className="absolute bottom-[42%] left-0 w-full pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-200/50 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: 0,
                animation: `splash 0.5s ease-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
        <span className="text-white text-sm font-medium tracking-wide">🌿 Living Ecosystem: {countryName}</span>
      </div>

      {/* ========== HOVER TOOLTIPS ========== */}
      
      {hoveredElement === "sky" && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-orange-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🌤️ Sky Color & Heat Shimmer</div>
          <div>Represents <strong>Surface Temperature Anomaly</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400" /> Cool (blue) = Normal</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400" /> Orange = Warming</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Red + Shimmer = Extreme heat</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Current: {surfaceTempAnomaly > 0 ? `+${surfaceTempAnomaly.toFixed(2)}°C` : `${surfaceTempAnomaly.toFixed(2)}°C`}</div>
        </div>
      )}

      {hoveredElement === "sun" && (
        <div className="absolute top-20 right-20 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-yellow-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">☀️ Pulsing Sun</div>
          <div>Represents <strong>Heat Intensity</strong></div>
          <div className="mt-2">Sun pulses faster and grows larger with higher temperatures</div>
          <div className="text-gray-400 text-[10px] mt-2">Current anomaly: {surfaceTempAnomaly > 0 ? `+${surfaceTempAnomaly.toFixed(2)}°C` : `${surfaceTempAnomaly.toFixed(2)}°C`}</div>
        </div>
      )}

      {hoveredElement === "ocean" && (
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-blue-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🌊 Moving Waves</div>
          <div>Represents <strong>Sea Level Anomaly</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">🌊 Wave intensity increases with sea level rise</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-400" /> Light blue = Normal</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600" /> Dark blue = Rising seas</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Current: {seaLevelAnomaly > 0 ? `+${(seaLevelAnomaly * 100).toFixed(0)}cm` : `${(seaLevelAnomaly * 100).toFixed(0)}cm`}</div>
        </div>
      )}

      {hoveredElement === "beach" && (
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-amber-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🏝️ Beach Color</div>
          <div>Represents <strong>Tourist Arrivals</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400" /> Golden sand = Thriving tourism</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-700" /> Dark brown = Tourism decline</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Current: {(touristArrivals / 1e3).toFixed(0)}K arrivals</div>
        </div>
      )}

      {hoveredElement === "grass" && (
        <div className="absolute bottom-1/3 left-10 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-green-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🌿 Swaying Grass</div>
          <div>Represents <strong>Livestock Yield</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">📈 Tall grass = High productivity</div>
            <div className="flex items-center gap-2">📉 Short grass = Low yield</div>
            <div className="flex items-center gap-2">🌾 Grass sways gently in the breeze</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Current: {livestockYield.toFixed(1)} tons</div>
        </div>
      )}

      {hoveredElement === "trunk" && (
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-purple-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🌴 Tree Trunk</div>
          <div>Represents <strong>People Affected & TB Incidence</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">📐 Bent trunk = More people affected</div>
            <div className="flex items-center gap-2">📏 Thin trunk = Higher TB incidence</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Affected: {peopleAffected.toLocaleString()} · TB: {tuberculosisIncidence.toFixed(0)}/100k</div>
        </div>
      )}

      {hoveredElement === "fronds" && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-emerald-500 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🍃 Swaying Fronds</div>
          <div>Represents <strong>Sea Surface Temperature & Economic Loss</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Green = Healthy ocean</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Yellow = Ocean warming</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Red = Marine heatwave</div>
            <div className="flex items-center gap-2">💔 Broken fronds + Falling leaves = Economic loss</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">SST: {seaSurfaceTemp > 0 ? `+${seaSurfaceTemp.toFixed(2)}°C` : `${seaSurfaceTemp.toFixed(2)}°C`} · Loss: ${(economicLoss / 1e6).toFixed(1)}M</div>
        </div>
      )}

      {hoveredElement === "coconut" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-amber-600 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">🥥 Floating Coconuts</div>
          <div>Represents <strong>Crop Yield</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">🍎 More coconuts = Higher yields</div>
            <div className="flex items-center gap-2">🍂 Fewer coconuts = Agricultural stress</div>
            <div className="flex items-center gap-2">🥥 Coconuts float gently on the tree</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Current: {cropYield.toFixed(1)} tons/ha · {coconutCount} nuts</div>
        </div>
      )}

      {hoveredElement === "rain" && (
        <div className="absolute top-1/4 left-10 z-30 bg-gray-900/95 backdrop-blur-md text-white text-xs px-5 py-3 rounded-xl shadow-2xl max-w-xs border-l-4 border-cyan-400 animate-fade-in">
          <div className="font-semibold mb-1 flex items-center gap-2">💧 Falling Raindrops</div>
          <div>Represents <strong>Rainfall Anomaly</strong></div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">🌧️ More/Heavier drops = Above-normal rain</div>
            <div className="flex items-center gap-2">☀️ Fewer/Lighter drops = Drought conditions</div>
            <div className="flex items-center gap-2">💦 Water splashes during heavy downpour</div>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">Current: {rainfallAnomaly > 0 ? `+${rainfallAnomaly.toFixed(1)}mm` : `${rainfallAnomaly.toFixed(1)}mm`}</div>
        </div>
      )}

      <style jsx>{`
        @keyframes rain {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(300px); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(var(--angle-start, -3deg)); }
          50% { transform: rotate(var(--angle-end, 3deg)); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(360deg); opacity: 0; }
        }
        @keyframes splash {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes heatShimmer {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}