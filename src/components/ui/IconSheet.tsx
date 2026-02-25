import Icon, { ICON_NAMES } from './Icon';

type IconSheetProps = {
  size?: number;
  className?: string;
};

export default function IconSheet({ size = 20, className = '' }: IconSheetProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 text-sm text-gray-700 ${className}`}>
      {ICON_NAMES.map((name) => (
        <div key={name} className="flex items-center gap-2">
          <Icon name={name} size={size} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
}
