import React from 'react';

type CarouselItemsProps = {
  children: React.ReactNode;
  itemsPerView: number;
  gap: number;
};

export default function CarouselItems({ children, itemsPerView, gap }: CarouselItemsProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="flex" style={{ gap: `${gap}px` }}>
      {childrenArray.map((child, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Carousel items are stable and order-dependent
          key={`carousel-item-${index}`}
          style={{
            minWidth: `calc((100% - ${gap * (itemsPerView - 1)}px) / ${itemsPerView})`,
            maxWidth: `calc((100% - ${gap * (itemsPerView - 1)}px) / ${itemsPerView})`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
