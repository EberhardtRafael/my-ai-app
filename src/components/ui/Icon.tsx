import type React from 'react';
import { twMerge } from 'tailwind-merge';
import { EyeClosedIcon, EyeOpenIcon } from '@/icons/EyeIcon';
import { CartIcon, ChevronDownIcon, DocumentTextIcon } from '@/icons/HeaderIcons';
import { HeartFilledIcon, HeartIcon } from '@/icons/HeartIcon';
import { ChevronLeftIcon, ChevronRightIcon } from '@/icons/NavigationIcons';
import StarIcon from '@/icons/StarIcon';
import ThumbsUpIcon from '@/icons/ThumbsUpIcon';
import { CheckCircleIcon, DocumentIcon, GithubIcon } from '@/icons/TicketIcons';
import { TrashIcon } from '@/icons/TrashIcon';

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  filled?: boolean;
  label?: string;
};

type IconRendererProps = {
  className?: string;
  filled?: boolean;
};

const PlusIcon: React.FC<IconRendererProps> = ({ className = '' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
  </svg>
);

const MinusIcon: React.FC<IconRendererProps> = ({ className = '' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
  </svg>
);

const HourglassIcon: React.FC<IconRendererProps> = ({ className = '' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 2h12M6 22h12M9 2v4a3 3 0 0 0 1 2.236l2 1.764 2-1.764A3 3 0 0 0 15 6V2m0 20v-4a3 3 0 0 0-1-2.236l-2-1.764-2 1.764A3 3 0 0 0 9 18v4"
    />
  </svg>
);

export const ICON_NAMES = [
  'cart',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'check-circle',
  'document',
  'document-text',
  'eye-closed',
  'eye-open',
  'github',
  'heart',
  'heart-filled',
  'hourglass',
  'minus',
  'plus',
  'star',
  'thumbs-up',
  'trash',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const iconMap: Record<IconName, (props: IconRendererProps) => React.ReactNode> = {
  cart: ({ className }) => <CartIcon className={className} />,
  'chevron-down': ({ className }) => <ChevronDownIcon className={className} />,
  'chevron-left': ({ className }) => <ChevronLeftIcon className={className} />,
  'chevron-right': ({ className }) => <ChevronRightIcon className={className} />,
  'check-circle': ({ className }) => <CheckCircleIcon className={className} />,
  document: ({ className }) => <DocumentIcon className={className} />,
  'document-text': ({ className }) => <DocumentTextIcon className={className} />,
  'eye-closed': ({ className }) => <EyeClosedIcon className={className} />,
  'eye-open': ({ className }) => <EyeOpenIcon className={className} />,
  github: ({ className }) => <GithubIcon className={className} />,
  heart: ({ className }) => <HeartIcon className={className} />,
  'heart-filled': ({ className }) => <HeartFilledIcon className={className} />,
  hourglass: ({ className }) => <HourglassIcon className={className} />,
  minus: ({ className }) => <MinusIcon className={className} />,
  plus: ({ className }) => <PlusIcon className={className} />,
  star: ({ className, filled }) => <StarIcon filled={filled} className={className} />,
  'thumbs-up': ({ className }) => <ThumbsUpIcon className={className} />,
  trash: ({ className }) => <TrashIcon className={className} />,
};

const textIcons: IconName[] = ['star', 'thumbs-up'];

export default function Icon({ name, size = 16, className = '', filled, label }: IconProps) {
  const IconRenderer = iconMap[name];
  const iconClassName = textIcons.includes(name) ? 'leading-none' : 'w-full h-full';

  return (
    <span
      className={twMerge('inline-flex items-center justify-center leading-none', className)}
      style={{ width: size, height: size, fontSize: size }}
      role={label ? 'img' : 'presentation'}
    >
      {IconRenderer({ className: iconClassName, filled })}
    </span>
  );
}
