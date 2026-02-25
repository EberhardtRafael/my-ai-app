import Link from 'next/link';

type InfoMessageProps = {
  message: string;
  linkText?: string;
  linkHref?: string;
  variant?: 'default' | 'muted';
  className?: string;
};

const InfoMessage: React.FC<InfoMessageProps> = ({
  message,
  linkText,
  linkHref,
  variant = 'default',
  className = '',
}) => {
  const textColor = variant === 'muted' ? 'text-gray-400' : 'text-gray-600';

  return (
    <p className={`${textColor} ${className}`}>
      {message}
      {linkText && linkHref && (
        <>
          {' '}
          <Link href={linkHref} className="text-blue-600 hover:text-blue-800 font-medium">
            {linkText}
          </Link>
        </>
      )}
    </p>
  );
};

export default InfoMessage;
