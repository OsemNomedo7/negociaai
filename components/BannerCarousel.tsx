"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

export default function BannerCarousel({ images, autoPlay = true, interval = 4000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (idx: number) => {
      if (animating || idx === current) return;
      setAnimating(true);
      setCurrent(idx);
      setTimeout(() => setAnimating(false), 500);
    },
    [animating, current]
  );

  const next = useCallback(() => go((current + 1) % images.length), [go, current, images.length]);
  const prev = useCallback(() => go((current - 1 + images.length) % images.length), [go, current, images.length]);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [autoPlay, interval, next, images.length]);

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="Banner"
        className="w-full h-48 md:h-64 object-cover rounded-2xl"
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group">
      {/* Slides */}
      <div className="relative h-48 md:h-64">
        {images.map((src, idx) => (
          <div
            key={src + idx}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              idx === current ? "opacity-100 scale-100" : "opacity-0 scale-[1.02] pointer-events-none"
            }`}
          >
            <img src={src} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Gradiente lateral para setas */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? "w-5 h-2 bg-white shadow-md"
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Barra de progresso */}
      {autoPlay && (
        <div className="absolute top-0 left-0 h-0.5 bg-white/30 w-full">
          <div
            key={current}
            className="h-full bg-white/70 rounded-full"
            style={{
              animation: `progress ${interval}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
