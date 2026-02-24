'use client';

import React from 'react';
import { useEffect, useRef, useState } from 'react';

type CarouselProps = {
  children: React.ReactNode;
  itemsPerView?: number;
  gap?: number;
  className?: string;
};

const Carousel: React.FC<CarouselProps> = ({
  children,
  itemsPerView = 4,
  gap = 16,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  useEffect(() => {
    updateScrollButtons();
  }, [currentIndex, totalItems]);

  const updateScrollButtons = () => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < maxIndex);
  };

  const scrollTo = (index: number) => {
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(newIndex);

    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.offsetWidth / itemsPerView;
      const scrollPosition = newIndex * (itemWidth + gap);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  const scrollLeft = () => {
    scrollTo(currentIndex - 1);
  };

  const scrollRight = () => {
    scrollTo(currentIndex + 1);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center border border-gray-200"
          aria-label="Scroll left"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex" style={{ gap: `${gap}px` }}>
          {childrenArray.map((child, index) => (
            <div
              key={index}
              style={{
                minWidth: `calc((100% - ${gap * (itemsPerView - 1)}px) / ${itemsPerView})`,
                maxWidth: `calc((100% - ${gap * (itemsPerView - 1)}px) / ${itemsPerView})`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center border border-gray-200"
          aria-label="Scroll right"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Dots Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-gray-700' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
