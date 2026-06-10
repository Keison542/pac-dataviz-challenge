"use client";

import { Island } from "@/lib/types";
import { islandColorScale, islandCoordinates } from "@/lib/utils";
import { geoOrthographic, geoPath } from "d3-geo";
import { FeatureCollection } from "geojson";
import { CircleItem } from "./CircleItem";
import { useState, useRef } from "react";
import type { InteractionData } from "@/dataviz/barplot/types/interaction";

import styles from "./bubble-map.module.css";

type BubbleMapProps = {
  width: number;
  height: number;
  data: FeatureCollection;
  selectedIsland: Island | undefined;
  setSelectedIsland: (newIsland: Island) => void;
  setHoveredIsland?: (interactionData: InteractionData | null) => void;
  scale: number;
  bubbleSize: number;
  showLabels?: boolean;
};

export const BubbleMap = ({
  width,
  height,
  data,
  selectedIsland,
  setSelectedIsland,
  setHoveredIsland,
  scale,
  bubbleSize,
  showLabels = true,
}: BubbleMapProps) => {
  const bubbleContainerRef = useRef<SVGGElement>(null);
  const [localHovered, setLocalHovered] = useState<string | null>(null);

  const projection = geoOrthographic()
    .rotate([200, 5])
    .scale(scale)
    .translate([width / 2, height / 2]);

  const geoPathGenerator = geoPath().projection(projection);

  // Improved landmass paths - lighter color
  const allSvgPaths = data.features
    .filter((shape) => shape.id !== "ATA")
    .map((shape) => {
      return (
        <path
          key={shape.id}
          d={geoPathGenerator(shape)}
          stroke="#cbd5e1"
          strokeWidth={0.6}
          fill="#e2e8f0"           // Light gray instead of dark grey/black
          fillOpacity={0.75}
        />
      );
    });

  const handleMouseEnter = (island: Island, x: number, y: number) => {
    setLocalHovered(island);
    if (setHoveredIsland) {
      setHoveredIsland({
        xPos: x,
        yPos: y,
        name: island,
        value: 0,
        country: island,
      });
    }
  };

  const handleMouseLeave = () => {
    setLocalHovered(null);
    if (setHoveredIsland) {
      setHoveredIsland(null);
    }
  };

  const allBubbles = islandCoordinates.map((island) => {
    const [x, y] = projection(island.coordinates);
    
    if (!x || !y || isNaN(x) || isNaN(y)) {
      return null;
    }

    const isSelected = selectedIsland === island.name;
    const isHovered = localHovered === island.name;
    
    let color = "#9ca3af"; // default gray
    if (isSelected || !selectedIsland) {
      color = islandColorScale(island.name);
    }
    if (isHovered) {
      color = islandColorScale(island.name);
    }

    let r = bubbleSize;
    if (isSelected) r = bubbleSize * 2.6;
    else if (isHovered) r = bubbleSize * 1.9;
    else if (!selectedIsland) r = bubbleSize * 1.25;
    else r = bubbleSize;

    let opacity = 0.85;
    if (selectedIsland && selectedIsland !== island.name && !isHovered) {
      opacity = 0.35;
    } else if (isSelected || isHovered) {
      opacity = 1;
    }

    return (
      <g 
        className={styles.circleContainer} 
        key={island.name}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => handleMouseEnter(island.name, x, y)}
        onMouseLeave={handleMouseLeave}
        onClick={() => setSelectedIsland(island.name)}
      >
        <CircleItem
          x={x}
          y={y}
          r={r}
          color={color}
          opacity={opacity}
          onClick={() => setSelectedIsland(island.name)}
        />
        
        {showLabels && (isSelected || isHovered || !selectedIsland) && (
          <text
            className={styles.circleText}
            x={x < width - 110 ? x + r + 6 : x - r - 6}
            y={y + 3}
            fill="#1e2937"
            fontSize={isSelected ? 14 : 12.5}
            fontWeight={isSelected ? "700" : "600"}
            alignmentBaseline="middle"
            textAnchor={x < width - 110 ? "start" : "end"}
            opacity={opacity}
            style={{ textShadow: "0 1px 3px rgba(255,255,255,0.95)" }}
          >
            {island.name}
            {isSelected && " ✓"}
          </text>
        )}
      </g>
    );
  }).filter(Boolean);

  return (
    <div className={styles.mapContainer}>
      <svg width={width} height={height} style={{ display: "block" }}>
        {allSvgPaths}
        <g
          ref={bubbleContainerRef}
          className={styles.bubbleLayer}
        >
          {allBubbles}
        </g>
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendTitle}>Selected Island</div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: islandColorScale("Fiji") }} />
          <span>Selected Island</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: "#9ca3af", opacity: 0.4 }} />
          <span>Other Islands</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: "#e2e8f0" }} />
          <span>Landmass</span>
        </div>
      </div>
    </div>
  );
};