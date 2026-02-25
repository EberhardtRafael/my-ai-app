import SectionHeader from './ui/SectionHeader';

type TrendingErrorStateProps = {
  hours: number;
  error: string;
};

export default function TrendingErrorState({ hours, error }: TrendingErrorStateProps) {
  return (
    <section className="py-8">
      <SectionHeader title="Trending Now" subtitle={`Popular items in the last ${hours} hours`} />
      <div className="text-center py-8 text-red-600">{error}</div>
    </section>
  );
}
