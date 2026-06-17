"use client";

export function StoryTransition({ text }: { text: string }) {
  return (
    <div className="py-10 text-center">
      <div className="max-w-2xl mx-auto text-slate-500 text-sm italic leading-relaxed border-l-2 border-slate-200 pl-4">
        {text}
      </div>
    </div>
  );
}
