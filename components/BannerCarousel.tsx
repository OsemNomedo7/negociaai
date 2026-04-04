"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
  /** Se true, cobre todo o pai (position absolute inset-0) */
  fullBleed?: boolean;
}

export default function BannerCarousel({ images, autoPlay = true, interval = 4500, fullBleed = false }: Props) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (idx: number) => {
      if (animating || idx === current) return;
      setAnimating(true);
      setCurrent(idx);
      setTimeout(() => setAnimating(false), 700);
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

  if (fullBleed) {
    return (
      <>
        {/* Slides como background absoluto */}
        {images.map((src, idx) => (
          <div
            key={src + idx}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: idx === current ? 1 : 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}

        {/* Overlay escuro para legibilidade do texto */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Setas — só com múltiplas imagens */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            >
              ›
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-20">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => go(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === current ? "w-6 h-2 bg-white shadow" : "w-2 h-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            {/* Barra de progresso */}
            {autoPlay && (
              <div className="absolute top-0 left-0 h-0.5 bg-white/20 w-full z-20">
                <div
                  key={current}
                  className="h-full bg-white/60 rounded-full"
                  style={{ animation: `progress ${interval}ms linear forwards` }}
                />
              </div>
            )}
          </>
        )}

        <style>{`
          @keyframes progress { from { width: 0% } to { width: 100% } }
          .group:hover .group-hover\\:opacity-100 { opacity: 1; }
        `}</style>
      </>
    );
  }

  // Modo inline (não fullBleed) — para uso eventual em outros lugares
  if (images.length === 1) {
    return <img src={images[0]} alt="Banner" className="w-full h-48 md:h-64 object-cover rounded-2xl" />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group">
      <div className="relative h-48 md:h-64">
        {images.map((src, idx) => (
          <div
            key={src + idx}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              idx === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img src={src} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">‹</button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">›</button>
      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
        {images.map((_, idx) => (
          <button key={idx} onClick={() => go(idx)} className={`rounded-full transition-all duration-300 ${idx === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
        ))}
      </div>
      <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
