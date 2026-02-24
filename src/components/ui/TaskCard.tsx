type TaskCardProps = {
  title: string;
  actualHours: number;
  similarity: number;
  className?: string;
};

export default function TaskCard({
  title,
  actualHours,
  similarity,
  className = '',
}: TaskCardProps) {
  return (
    <div className={`bg-gray-50 rounded p-3 text-sm ${className}`}>
      <p className="font-medium">{title}</p>
      <p className="text-gray-600">
        Actual: {actualHours}h • Similarity: {Math.round(similarity * 100)}%
      </p>
    </div>
  );
}
