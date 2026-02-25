import type React from 'react';

export type TableWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export type TableElementProps<T extends keyof React.JSX.IntrinsicElements> =
  React.JSX.IntrinsicElements[T] & {
    className?: string;
  };
