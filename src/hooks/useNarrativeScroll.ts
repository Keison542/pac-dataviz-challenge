
"use client";

import { useEffect, useState } from "react";

export type StoryStep = "pressure" | "shock" | "system" | "synthesis";

export function useNarrativeScroll() {
  const [step, setStep] = useState<StoryStep>("pressure");

  useEffect(() => {
    const map: Record<string, StoryStep> = {
      pressure: "pressure",
      shock: "shock",
      system: "system",
      synthesis: "synthesis",
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (map[id]) setStep(map[id]);
          }
        });
      },
      { threshold: 0.55 }
    );

    ["pressure", "shock", "system", "synthesis"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return step;
}
