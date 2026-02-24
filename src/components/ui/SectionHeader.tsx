type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  description,
  className = '',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </div>
  );
};

export default SectionHeader;
