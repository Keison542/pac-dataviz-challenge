"use client";

import { animated, useSpring } from "@react-spring/web";
import { useState } from "react";

type CircleItemProps = {
  x: number;
  y: number;
  color: string;
  r?: number;
  opacity?: number;
  strokeWidth?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
  showPulse?: boolean;
  label?: string;
  labelPosition?: "left" | "right" | "top" | "bottom";
};

export const CircleItem = ({
  x,
  y,
  color,
  r = 10,
  opacity = 0.7,
  strokeWidth = 1,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isSelected = false,
  isHovered = false,
  showPulse = false,
  label,
  labelPosition = "right",
}: CircleItemProps) => {
  const [localHovered, setLocalHovered] = useState(false);

  const handleMouseEnter = () => {
    setLocalHovered(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    onMouseLeave?.();
  };

  const active = isSelected || isHovered || localHovered;

  const finalRadius = active ? r * 1.3 : r;
  const finalOpacity = active ? Math.min(opacity + 0.2, 1) : opacity;

  // ✅ SAFE SPRING (ONLY opacity + radius)
  const circleSpring = useSpring({
    r: finalRadius,
    opacity: finalOpacity,
    config: {
      tension: 200,
      friction: 25,
    },
  });

  const getLabelOffset = () => {
    const offset = finalRadius + 5;
    switch (labelPosition) {
      case "left":
        return { x: -offset, y: 0, textAnchor: "end" as const };
      case "right":
        return { x: offset, y: 0, textAnchor: "start" as const };
      case "top":
        return { x: 0, y: -offset, textAnchor: "middle" as const };
      case "bottom":
        return { x: 0, y: offset, textAnchor: "middle" as const };
    }
  };

  const labelOffset = getLabelOffset();

  return (
    <g style={{ cursor: onClick ? "pointer" : "default" }}>
      {/* Main circle */}
      <animated.circle
        cx={x}
        cy={y}
        r={circleSpring.r}
        fill={color}
        fillOpacity={active ? 0.5 : 0.3}
        stroke={color}
        strokeWidth={active ? strokeWidth + 0.5 : strokeWidth}
        opacity={circleSpring.opacity}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Inner highlight */}
      {active && (
        <circle
          cx={x}
          cy={y}
          r={finalRadius * 0.4}
          fill="white"
          fillOpacity={0.3}
          pointerEvents="none"
        />
      )}

      {/* Label */}
      {label && (active || !isSelected) && (
        <text
          x={x}
          y={y}
          dx={labelOffset.x}
          dy={labelOffset.y}
          fill={color}
          fontSize={active ? 12 : 10}
          fontWeight={active ? "bold" : "normal"}
          textAnchor={labelOffset.textAnchor}
          alignmentBaseline="middle"
          opacity={active ? 1 : 0.7}
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );
};