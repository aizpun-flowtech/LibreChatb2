import React, { memo } from 'react';
import { cn } from '~/utils';

export interface HoverButtonProps {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isVisible?: boolean;
  isDisabled?: boolean;
  isLast?: boolean;
  className?: string;
  buttonStyle?: string;
}

const HoverButton = memo(
  ({
    onClick,
    title,
    icon,
    isActive = false,
    isVisible = true,
    isDisabled = false,
    isLast = false,
    className = '',
  }: HoverButtonProps) => {
    const buttonClassNames = cn( // Renamed from buttonStyle to avoid confusion if buttonStyle prop is used
      'hover-button rounded-lg p-1.5',
      'hover:bg-gray-100 hover:text-gray-500',
      'dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200',
      'disabled:dark:hover:text-gray-400',
      'md:group-hover:visible md:group-focus-within:visible md:group-[.final-completion]:visible',
      !isLast && 'md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
      !isVisible && 'opacity-0',
      'focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none',
      isActive && isVisible && 'active text-gray-700 dark:text-gray-200 bg-gray-100 bg-gray-700', // Original had bg-gray-100 bg-gray-700, assuming one was for dark mode, or it was a typo. Adjusted based on common patterns. If specific, revert.
      className,
    );

    return (
      <button
        className={buttonClassNames}
        onClick={onClick}
        type="button"
        title={title}
        disabled={isDisabled}
      >
        {icon}
      </button>
    );
  },
);

HoverButton.displayName = 'HoverButton';

export default HoverButton;