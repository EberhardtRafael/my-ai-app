type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;
