"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const SWIPE_THRESHOLD_PX = 36;
/** Ширина активного слайда — остальное уходит в peek слева/справа */
const SLIDE_RATIO = 0.82;
const GAP_PX = 10;

export type PeekCarouselSlide = {
  key: string;
  src: string;
  alt: string;
  fit?: "cover" | "contain";
};

type PeekCarouselProps = {
  slides: PeekCarouselSlide[];
  index: number;
  onIndexChange: (index: number) => void;
  className?: string;
  showArrows?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  onSwipe?: () => void;
  overlay?: ReactNode;
};

export function PeekCarousel({
  slides,
  index,
  onIndexChange,
  className = "",
  showArrows = false,
  prevLabel = "Previous",
  nextLabel = "Next",
  onSwipe,
  overlay,
}: PeekCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const count = slides.length;
  const canSlide = count > 1;
  const safeIndex =
    count === 0 ? 0 : ((index % count) + count) % count;

  const slideWidth = containerWidth * SLIDE_RATIO;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (!canSlide) return;
      const next = (safeIndex + delta + count) % count;
      onIndexChange(next);
    },
    [canSlide, count, onIndexChange, safeIndex],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!canSlide) return;
      const touch = event.touches[0];
      if (!touch) return;
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    },
    [canSlide],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!canSlide || !touchStart.current) return;
      const touch = event.changedTouches[0];
      if (!touch) {
        touchStart.current = null;
        return;
      }

      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      touchStart.current = null;

      if (
        Math.abs(dx) < SWIPE_THRESHOLD_PX ||
        Math.abs(dx) < Math.abs(dy) * 1.2
      ) {
        return;
      }

      onSwipe?.();
      go(dx < 0 ? 1 : -1);
    },
    [canSlide, go, onSwipe],
  );

  if (count === 0) return null;

  const offset =
    containerWidth > 0 && slideWidth > 0
      ? containerWidth / 2 -
        slideWidth / 2 -
        safeIndex * (slideWidth + GAP_PX)
      : 0;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full"
        style={{
          gap: `${GAP_PX}px`,
          transform: `translateX(${offset}px)`,
          transition:
            containerWidth > 0 ? "transform 350ms ease-out" : undefined,
        }}
      >
        {slides.map((slide, slideIndex) => {
          const isActive = slideIndex === safeIndex;
          return (
            <div
              key={slide.key}
              className="relative h-full shrink-0 overflow-hidden rounded-sm bg-off-white transition-[opacity,transform] duration-300 ease-out"
              style={{
                width:
                  slideWidth > 0 ? slideWidth : `${SLIDE_RATIO * 100}%`,
                opacity: isActive ? 1 : 0.55,
                transform: isActive ? "scale(1)" : "scale(0.96)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                decoding="async"
                loading="lazy"
                draggable={false}
                className={
                  slide.fit === "cover"
                    ? "pointer-events-none absolute inset-0 h-full w-full object-cover"
                    : "pointer-events-none absolute inset-0 h-full w-full object-contain p-3 sm:p-4"
                }
              />
            </div>
          );
        })}
      </div>

      {overlay}

      {showArrows && canSlide ? (
        <>
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-white sm:left-3 sm:h-11 sm:w-11"
          >
            <span aria-hidden className="text-lg leading-none sm:text-xl">
              ‹
            </span>
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-white sm:right-3 sm:h-11 sm:w-11"
          >
            <span aria-hidden className="text-lg leading-none sm:text-xl">
              ›
            </span>
          </button>
        </>
      ) : null}
    </div>
  );
}
