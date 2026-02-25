import type { ReactNode } from 'react';
import SectionHeader from './ui/SectionHeader';

type TrendingVariant = 'loading' | 'error';

type TrendingStateFactoryProps = {
  hours: number;
  title: string;
  subtitle: string;
} & (
  | {
      variant: 'loading';
      error?: never;
    }
  | {
      variant: 'error';
      error: string;
    }
);

type VariantRenderer = (props: TrendingStateFactoryProps) => ReactNode;

const variantConfigs: Record<TrendingVariant, VariantRenderer> = {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  ),
  error: (props) => (
    <div className="text-center py-8 text-red-600">
      {props.variant === 'error' ? props.error : ''}
    </div>
  ),
};

export default function TrendingStateFactory(props: TrendingStateFactoryProps) {
  const renderVariant = variantConfigs[props.variant];

  return (
    <section className="py-8">
      <SectionHeader title={props.title} subtitle={props.subtitle} />
      {renderVariant(props)}
    </section>
  );
}
