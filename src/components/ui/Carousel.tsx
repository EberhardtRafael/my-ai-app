'use client';

import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Button from './Button';
import CarouselItems from './CarouselItems';
import PaginationDots from './PaginationDots';

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
        <Button
          type="button"
          onClick={scrollLeft}
          variant="ghost"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center border border-gray-200"
          aria-label="Scroll left"
        >
          <Icon name="chevron-left" size={24} className="text-gray-700" />
        </Button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        <CarouselItems itemsPerView={itemsPerView} gap={gap}>
          {children}
        </CarouselItems>
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <Button
          type="button"
          onClick={scrollRight}
          variant="ghost"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center border border-gray-200"
          aria-label="Scroll right"
        >
          <Icon name="chevron-right" size={24} className="text-gray-700" />
        </Button>
      )}

      {/* Dots Indicator */}
      <PaginationDots total={maxIndex + 1} currentIndex={currentIndex} onDotClick={scrollTo} />
    </div>
  );
};

export default Carousel;
