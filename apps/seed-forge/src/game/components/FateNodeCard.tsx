// src/game/components/FateNodeCard.tsx
import React from "react";
import { GameEvent } from "../events/eventLibrary";

interface FateNodeCardProps {
  event: GameEvent;
  onChoice: (index: number) => void;
}

export const FateNodeCard: React.FC<FateNodeCardProps> = ({ event, onChoice }) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 space-y-4">
      <div className="text-2xl font-bold text-cyan-300 mb-2">{event.title}</div>
      
      <div className="text-sm text-slate-300 opacity-90 whitespace-pre-line leading-relaxed">
        {event.description}
      </div>

      {event.choices.length > 0 ? (
        <div className="space-y-2 mt-6">
          {event.choices.map((choice, i) => (
            <button
              key={i}
              className="block w-full text-left px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/50 hover:border-cyan-400/50 transition-all text-sm text-slate-200 hover:text-cyan-100"
              onClick={() => onChoice(i)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/50">
          <div className="text-lg text-emerald-400 font-semibold text-center">
            🏆 你已达到终点
          </div>
          <div className="text-sm text-emerald-300/80 text-center mt-2">
            命运之旅已完成
          </div>
        </div>
      )}
    </div>
  );
};

