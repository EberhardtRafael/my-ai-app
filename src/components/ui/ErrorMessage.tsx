type ErrorMessageProps = {
  message: string;
  className?: string;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`text-center py-4 px-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <p className="text-red-600">{message}</p>
    </div>
  );
};

export default ErrorMessage;
