import SectionHeader from './ui/SectionHeader';

type TrendingLoadingStateProps = {
  hours: number;
};

export default function TrendingLoadingState({ hours }: TrendingLoadingStateProps) {
  return (
    <section className="py-8">
      <SectionHeader title="Trending Now" subtitle={`Popular items in the last ${hours} hours`} />
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    </section>
  );
}
