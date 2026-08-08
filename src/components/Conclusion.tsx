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

   <section>
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
        These impacts do not occur in isolation. Across the Pacific, changes in temperature, rainfall, ocean conditions and sea level can cascade through economies, livelihoods and communities. The evidence shows that climate risk is not determined by exposure alone: countries differ in the scale of their impacts and in their capacity to absorb and recover from repeated shocks.
        <br /> 
        <br /> 
        The Pacific climate story is therefore not simply a story of a warming environment. It is a story of <span className="font-semibold text-slate-800"> interconnected impacts and unequal consequences</span>. Understanding these differences can help identify where adaptation, resilience investment and support are needed most.      
        </p>
    </div>
  </section>


     
  );
}
