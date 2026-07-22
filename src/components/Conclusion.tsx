interface ConclusionProps {
  selectedCountry: string;
  seaTrend: number;
  countriesCount: number;
}

export function Conclusion({
  selectedCountry,
  seaTrend,
  countriesCount,
}: ConclusionProps) {
  return (

       <section className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-4xl text-center">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
            From the data, one Pattern Emerges
          </div>
        
          <p className="mt-8 text-lg text-slate-600 leading-relaxed">
            Climate signals intensify.
            <br />
            <br />
            Environmental changes persist.
            <br />
            <br />

             Economic losses accumulate.
            <br />
            <br />
            Human exposure grows.
            <br />
            <br />
            Climate change is already shaping everyday life across the Pacific. It affects crops, fisheries, tourism, coastlines, and the wellbeing of communities. These are no longer future challenges—they are happening now. By connecting environmental, economic, and human systems, this data story shows that climate change is more than a collection of environmental indicators—it is a chain of interconnected impacts. While every Pacific nation faces rising climate pressures, their vulnerability and capacity to adapt are not the same. Understanding these differences is essential for building informed policies, targeted adaptation strategies, and a more resilient Pacific.
          </p>
        </div>
      </section>

     
  );
}
