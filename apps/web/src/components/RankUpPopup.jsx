"use client";

import { useEffect, useRef, useState } from "react";

export default function RankUpPopup({ rank, autoDismissMs = 4000, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 400);
    }, autoDismissMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [rank, autoDismissMs, onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        visible ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss?.(), 400);
        }}
      />
      <div
        className={`relative flex flex-col items-center gap-4 rounded-3xl border-2 px-12 py-10 text-center shadow-[0_0_80px_rgba(139,92,246,0.4)] transition-all duration-500 ${
          visible ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
        style={{
          borderColor: `${rank.color}66`,
          background: `linear-gradient(145deg, ${rank.color}22, rgba(0,0,0,0.9))`,
        }}
      >
        <div className="text-7xl animate-bounce">{rank.icon}</div>
        <div className="text-4xl font-black tracking-tight text-white drop-shadow-lg" style={{ textShadow: `0 0 30px ${rank.color}` }}>
          {rank.name}
        </div>
        <div className="text-sm uppercase tracking-[0.3em] text-zinc-400">Rank Up!</div>
        <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: "100%", background: `linear-gradient(90deg, ${rank.color}, #fff)` }}
          />
        </div>
      </div>
    </div>
  );
}