type LoadingSpinnerProps = {
  message?: string;
  className?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      {message && <span className="ml-3 text-gray-600">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
