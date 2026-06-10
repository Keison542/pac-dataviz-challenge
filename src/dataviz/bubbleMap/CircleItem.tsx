"use client";

import { useSpring, animated } from "@react-spring/web";
import { useState } from "react";

type CircleItemProps = {
  x: number;
  y: number;
  color: string;
  r: number;
  opacity?: number;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
  strokeWidth?: number;
  showPulse?: boolean;
};

export const CircleItem = ({ 
  x, 
  y, 
  color, 
  r, 
  opacity = 0.3,
  onClick, 
  onMouseEnter, 
  onMouseLeave,
  isSelected = false,
  isHovered = false,
  strokeWidth = 1,
  showPulse = false,
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

  // Animation for the main circle
  const circleSpring = useSpring({
    from: {
      r: 1,
      opacity: 0,
    },
    to: {
      r,
      x,
      y,
      opacity: opacity,
    },
    config: {
      friction: 80,
      tension: 200,
    },
  });

  // Animation for the outer ring (selection effect)
  const ringSpring = useSpring({
    from: {
      r: 0,
      opacity: 0,
    },
    to: {
      r: isSelected || isHovered || localHovered ? r + 4 : 0,
      opacity: isSelected || isHovered || localHovered ? 0.6 : 0,
    },
    config: {
      friction: 60,
      tension: 300,
    },
  });

  // Animation for pulse effect (when selected)
  const pulseSpring = useSpring({
    from: {
      r: r,
      opacity: 0.4,
    },
    to: async (next) => {
      if (showPulse || isSelected) {
        while (true) {
          await next({ r: r + 6, opacity: 0 });
          await next({ r: r, opacity: 0.4 });
        }
      }
    },
    config: {
      friction: 50,
      tension: 200,
    },
    reset: true,
    loop: showPulse || isSelected,
  });

  // Determine fill based on selection/hover state
  const fillColor = color === "black" ? "transparent" : color;
  const fillOpacity = isSelected ? 0.5 : isHovered || localHovered ? 0.4 : opacity;
  const strokeColor = isSelected ? color : isHovered || localHovered ? color : color;
  const strokeWidthValue = isSelected ? strokeWidth + 1 : isHovered || localHovered ? strokeWidth + 0.5 : strokeWidth;

  return (
    <g>
      {/* Pulse animation ring */}
      {(showPulse || isSelected) && (
        <animated.circle
          cy={circleSpring.y}
          cx={circleSpring.x}
          r={pulseSpring.r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidthValue}
          opacity={pulseSpring.opacity}
          pointerEvents="none"
        />
      )}

      {/* Selection/Hover ring */}
      <animated.circle
        cy={circleSpring.y}
        cx={circleSpring.x}
        r={ringSpring.r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidthValue + 0.5}
        opacity={ringSpring.opacity}
        pointerEvents="none"
      />

      {/* Main circle */}
      <animated.circle
        cy={circleSpring.y}
        cx={circleSpring.x}
        r={circleSpring.r}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidthValue}
        opacity={circleSpring.opacity}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cursor={"pointer"}
        style={{
          transition: "filter 0.2s ease-in-out",
        }}
      />

      {/* Inner highlight for better visibility */}
      {(isSelected || isHovered || localHovered) && (
        <animated.circle
          cy={circleSpring.y}
          cx={circleSpring.x}
          r={circleSpring.r ? (typeof circleSpring.r === 'number' ? circleSpring.r * 0.4 : r * 0.4) : r * 0.4}
          fill="white"
          fillOpacity={0.3}
          pointerEvents="none"
        />
      )}
    </g>
  );
};