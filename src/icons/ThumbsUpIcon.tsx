type ThumbsUpIconProps = {
  className?: string;
};

export default function ThumbsUpIcon({ className = '' }: ThumbsUpIconProps) {
  return <span className={className}>👍</span>;
}
