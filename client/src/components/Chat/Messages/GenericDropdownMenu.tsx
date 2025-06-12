import React, { useState, useId, useMemo } from 'react';
import * as Ariakit from '@ariakit/react';
import { DropdownPopup, TooltipAnchor } from '~/components/ui';
import { cn } from '~/utils'; // Assuming this is your classnames utility
import HoverButton from './HoverButton';

// Define the props for the new module
export interface OptionConfig {
  id: string; // Unique ID for the option, used as key and for internal referencing
  optionName: string; // Text to display for the option
  onClick: () => void; // Function to call when option is clicked
  icon?: React.ReactNode; // Optional icon for the option
  disabled?: boolean; // Optional flag to disable the option
  // If you need custom rendering per item, you could add a render function here:
  // render?: (props: Ariakit.MenuItemProps & { item: OptionConfig }) => React.ReactNode;
}

export interface GenericDropdownMenuProps {
  /** Accessible title/tooltip for the trigger button */
  title: string;

  isLast: boolean;
  /** Content to display inside the trigger button (e.g., an icon or text) */
  triggerButtonContent: React.ReactNode;
  /** Array of options to display in the dropdown */
  options: OptionConfig[];
  /** Optional ID for the menu; a unique ID will be generated if not provided */
  menuId?: string;
  /** Optional className for the trigger button for custom styling */
  triggerButtonClassName?: string;
  /** Optional className for the dropdown menu itself */
  menuClassName?: string;
  /** Optional prefix for item keys if needed for uniqueness in complex scenarios */
  itemKeyPrefix?: string;
  /** Callback when the menu open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  openDialog?: () => void;
  setSelectedFeedbackOption?: () => void;
}

const GenericDropdownMenu: React.FC<GenericDropdownMenuProps> = ({
  title,
  isLast,
  triggerButtonContent,
  options,
  menuId: providedMenuId,
  triggerButtonClassName,
  menuClassName,
  itemKeyPrefix = 'generic-menu-item',
  onOpenChange,
  openDialog,
  setSelectedFeedbackOption
}) => {
  const internalMenuId = useId();
  const menuId = providedMenuId || internalMenuId;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSetIsMenuOpen = (open: boolean) => {
    setIsMenuOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const dropdownItems = useMemo(() => {
    return options.map((option, index) => ({
      id: option.id,
      label: option.label,
      onClick: () => {
        openDialog()
        setSelectedFeedbackOption(index)
        // Optionally hide menu on click, can be made configurable
        // setIsMenuOpen(false);
      },
      disabled: option.disabled,
      // If you added a custom render function to OptionConfig:
      // render: option.render ? (props) => option.render?.({ ...props, item: option }) : undefined,
    }));
  }, [options]);

  return (
    <DropdownPopup
      menuId={menuId}
      isOpen={isMenuOpen}
      setIsOpen={handleSetIsMenuOpen}
      focusLoop={true} // Sensible default
      unmountOnHide={true} // Sensible default
      className={menuClassName} // Pass along className for the menu itself
      keyPrefix={itemKeyPrefix} // More generic key prefix
      trigger={
        <Ariakit.MenuButton
          id={`${menuId}-button`} // Ensure button id is unique and related to menu
          aria-label={title} // Use title for accessible label
          className={cn(
            'rounded-xl',
            isMenuOpen ? 'active' : '', // Open state style
            triggerButtonClassName, // Allow overriding/extending styles
          )}
          data-testid="generic-dropdown-trigger"
        >
          <HoverButton icon={triggerButtonContent} className="active" isLast={isLast} />
        </Ariakit.MenuButton>
      }
      items={dropdownItems}
    />
  );
};

export default GenericDropdownMenu;