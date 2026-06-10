import { useState, useCallback } from "react";
import type { IslandSelectPayload } from "@/app/page";

interface DashboardState {
  selectedCountry: string;
  setSelectedCountry: (c: string) => void;
  selectedIslandPos: { x: number; y: number } | null;
  setSelectedIslandPos: (pos: { x: number; y: number }) => void;
  lastPayload: IslandSelectPayload | null;
  setLastPayload: (p: IslandSelectPayload) => void;
  hovered: number | null;
  setHovered: (y: number | null) => void;
}

export function useDashboardState(initialCountry: string): DashboardState {
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry);
  const [selectedIslandPos, setSelectedIslandPos] = useState<{ x: number; y: number } | null>(null);
  const [lastPayload, setLastPayload] = useState<IslandSelectPayload | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleSetCountry = useCallback((c: string) => {
    setSelectedCountry(c);
  }, []);

  const handleSetPos = useCallback((pos: { x: number; y: number }) => {
    setSelectedIslandPos(pos);
  }, []);

  const handleSetPayload = useCallback((p: IslandSelectPayload) => {
    setLastPayload(p);
  }, []);

  return {
    selectedCountry,
    setSelectedCountry: handleSetCountry,
    selectedIslandPos,
    setSelectedIslandPos: handleSetPos,
    lastPayload,
    setLastPayload: handleSetPayload,
    hovered,
    setHovered,
  };
}