import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import {
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
} from '@remixicon/react';
import { Tag } from './tag';
import { Checkbox } from './checkbox';
import { Spinner } from './spinner';
import { cn } from './lib/utils';

interface Option {
  value: string | number;
  label: string;
  data?: any; // Additional data for the option
}

// Overload for single selection (backwards compatibility)
interface SingleSelectProps {
  options: Option[];
  value?: string | number;
  selectedLabelFallback?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  emptyMessage?: string;
  allowClear?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  disableLocalFilter?: boolean;
  onSearchChange?: (value: string) => void;
  onLoadMore?: () => void;
  multiple?: false;
}

// Overload for multiple selection
interface MultiSelectProps {
  options: Option[];
  value?: (string | number)[];
  selectedLabelFallback?: string;
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  emptyMessage?: string;
  allowClear?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  disableLocalFilter?: boolean;
  onSearchChange?: (value: string) => void;
  onLoadMore?: () => void;
  multiple: true;
}

export type SearchSelectProps = SingleSelectProps | MultiSelectProps;

// Kit-derived field styling (mirrors design-system InputRoot lg, but the
// trigger needs multi-chip flow + local open/error states, so it is
// composed from the same tokens rather than InputRoot itself).
const fieldBaseClasses = cn(
  'w-full border rounded-lg bg-bg-white-0 text-sm transition-colors',
  'focus-within:border-stroke-strong-950 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
);

const SearchSelect: React.FC<SearchSelectProps> = ({
  options,
  value,
  selectedLabelFallback,
  onChange,
  placeholder = 'Search or select option...',
  className = '',
  disabled = false,
  error = false,
  emptyMessage = 'No options found',
  allowClear = true,
  loading = false,
  hasMore = false,
  disableLocalFilter = false,
  onSearchChange,
  onLoadMore,
  multiple = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState(''); // New state for search in multiple mode
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingMoreRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // Handle multiple vs single value
  const selectedValues = useMemo(() => {
    return multiple && Array.isArray(value) ? value : value ? [value] : [];
  }, [multiple, value]);

  // For single select, find the selected option
  const selectedOption = useMemo(() => {
    return !multiple && value
      ? options.find(
          (option) => option?.value?.toString() === value?.toString()
        )
      : null;
  }, [multiple, value, options]);

  // Update input value when selection changes or component mounts
  useEffect(() => {
    if (multiple) {
      // For multiple selection, we'll show tags, so keep input empty for search
      if (!isOpen) {
        setInputValue('');
        setSearchValue('');
      }
    } else {
      if (isOpen) {
        return;
      }

      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else if (selectedLabelFallback && value) {
        setInputValue(selectedLabelFallback);
      } else {
        setInputValue('');
      }
    }
  }, [
    selectedValues,
    selectedOption,
    selectedLabelFallback,
    multiple,
    isOpen,
    value,
  ]);

  const filteredOptions = useMemo(() => {
    if (disableLocalFilter) {
      return options;
    }

    const searchTerm = multiple ? searchValue : inputValue;

    if (!searchTerm || (!multiple && selectedOption?.label === inputValue)) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [
    disableLocalFilter,
    inputValue,
    searchValue,
    options,
    selectedOption,
    multiple,
  ]);

  useEffect(() => {
    if (!loading) {
      loadingMoreRef.current = false;
    }
  }, [loading]);

  // Close dropdown when clicking outside (the menu is portaled, so check it too)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger =
        dropdownRef.current && dropdownRef.current.contains(target);
      const insideMenu = menuRef.current && menuRef.current.contains(target);
      if (!insideTrigger && !insideMenu) {
        setIsOpen(false);
        // Reset input to selected value when clicking outside
        if (selectedOption) {
          setInputValue(selectedOption.label);
        } else if (selectedLabelFallback && value) {
          setInputValue(selectedLabelFallback);
        } else {
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedOption, selectedLabelFallback, value]);

  // Track the trigger's viewport rect so the portaled menu stays anchored
  // even when the surrounding popover scrolls or the window resizes.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const updateRect = () => {
      const el = dropdownRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenuRect({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleOptionSelect = (option: Option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(option.value);

      if (isSelected) {
        // Remove the option
        const newValues = currentValues.filter((v) => v !== option.value);
        (onChange as (value: (string | number)[]) => void)(newValues);
      } else {
        // Add the option
        const newValues = [...currentValues, option.value];
        (onChange as (value: (string | number)[]) => void)(newValues);
      }
      // Don't close dropdown for multiple selection
    } else {
      (onChange as (value: string) => void)(option.value as string);
      setInputValue(option.label);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      (onChange as (value: (string | number)[]) => void)([]);
    } else {
      (onChange as (value: string) => void)('');
    }
    setIsOpen(false);
  };

  const handleRemoveTag = (valueToRemove: string | number) => {
    if (multiple && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== valueToRemove);
      (onChange as (value: (string | number)[]) => void)(newValues);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (multiple) {
      setSearchValue(value);
      setInputValue(value);
    } else {
      setInputValue(value);
    }
    onSearchChange?.(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else {
        setInputValue('');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      } else if (filteredOptions.length > 1) {
        // Find exact match
        const exactMatch = filteredOptions.find(
          (option) => option.label.toLowerCase() === inputValue.toLowerCase()
        );
        if (exactMatch) {
          handleOptionSelect(exactMatch);
        }
      }
    }
  };

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !hasMore || loading || loadingMoreRef.current) {
      return;
    }

    const target = e.currentTarget;
    const threshold = 24;
    const isNearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;

    if (isNearBottom) {
      loadingMoreRef.current = true;
      onLoadMore();
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Search Input Field */}
      <div className="relative">
        {multiple ? (
          // Multiple selection with tags
          <div
            className={cn(
              fieldBaseClasses,
              'min-h-10 px-2.5 py-1 flex flex-wrap items-center gap-1',
              error ? 'border-error-base' : 'border-stroke-soft-200',
              disabled
                ? 'bg-bg-weak-50 cursor-not-allowed'
                : 'hover:border-stroke-sub-300',
              isOpen &&
                'border-stroke-strong-950 ring-2 ring-ring ring-offset-2'
            )}
          >
            {/* Display selected tags */}
            {selectedValues.map((val, index) => {
              // Ensure val is a string or number for display
              const displayVal = Array.isArray(val) ? val[0] : val;
              const option = options.find((opt) => opt.value === displayVal);
              const label = option?.label || displayVal?.toString() || '';

              return (
                <Tag
                  key={`${displayVal}-${index}`}
                  variant="gray"
                  size="sm"
                  state={disabled ? 'disabled' : 'default'}
                  onRemove={
                    !disabled
                      ? () => handleRemoveTag(displayVal as string | number)
                      : undefined
                  }
                >
                  {label}
                </Tag>
              );
            })}

            {/* Search input on the right */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder={selectedValues.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-text-strong-950 placeholder:text-text-soft-400 disabled:cursor-not-allowed"
              style={{ minWidth: selectedValues.length > 0 ? '120px' : 'auto' }}
            />
          </div>
        ) : (
          // Single selection (original input)
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full h-10 pl-3 pr-14 border rounded-lg bg-bg-white-0 text-sm text-text-strong-950 transition-colors',
              'placeholder:text-text-soft-400',
              'focus:outline-none focus:border-stroke-strong-950 focus:ring-2 focus:ring-ring focus:ring-offset-2',
              error ? 'border-error-base' : 'border-stroke-soft-200',
              disabled
                ? 'bg-bg-weak-50 cursor-not-allowed'
                : 'hover:border-stroke-sub-300',
              isOpen &&
                'border-stroke-strong-950 ring-2 ring-ring ring-offset-2'
            )}
          />
        )}

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Clear Button */}
          {allowClear &&
            (multiple ? selectedValues.length > 0 : selectedOption) &&
            !disabled && (
              <button
                onClick={handleClear}
                className="text-icon-soft-400 hover:text-text-sub-600 transition-colors"
                type="button"
                aria-label="Clear selection"
              >
                <RiCloseLine aria-hidden className="size-4" />
              </button>
            )}
          {/* Dropdown Icon */}
          <button
            onClick={handleToggle}
            className="text-icon-soft-400 hover:text-text-sub-600 transition-colors"
            type="button"
            aria-label="Toggle dropdown"
          >
            <RiArrowDownSLine
              aria-hidden
              className={cn(
                'size-5 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu — portaled to <body> so it isn't clipped by the
          surrounding Popover's overflow / stacking context. We stop
          mousedown from bubbling to document so a click on an option
          doesn't trip the Popover's outside-click close handler. */}
      {isOpen &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            data-searchable-dropdown-portal=""
            style={{
              position: 'fixed',
              top: menuRect.top + 4,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 1000,
              // Re-enable clicks even when a modal ancestor (Radix Dialog /
              // FormModal / Sheet) sets `pointer-events: none` on <body> — the
              // menu is portaled to <body>, outside the dialog's content tree.
              pointerEvents: 'auto',
            }}
            className="bg-bg-white-0 border border-stroke-soft-200 rounded-lg shadow-custom-shadows-medium max-h-60 overflow-y-auto"
            onScroll={handleDropdownScroll}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopPropagation();
            }}
          >
            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? selectedValues.includes(option.value)
                    : selectedOption?.value === option.value;

                  return (
                    <div
                      key={option.value}
                      onClick={() => handleOptionSelect(option)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-bg-weak-50 transition-colors cursor-pointer flex items-center gap-2',
                        isSelected
                          ? 'text-accent font-medium'
                          : 'text-text-strong-950'
                      )}
                    >
                      {multiple && (
                        <Checkbox
                          checked={isSelected}
                          tabIndex={-1}
                          className="pointer-events-none"
                          aria-hidden
                        />
                      )}
                      <span className="flex-1">{option.label}</span>
                      {!multiple && isSelected && (
                        <RiCheckLine
                          aria-hidden
                          className="size-4 shrink-0 text-accent"
                        />
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-text-sub-600">
                    <Spinner size="xs" tone="neutral" />
                    <span>Loading…</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-text-soft-400 text-center">
                {loading ? (
                  <>
                    <Spinner size="xs" tone="neutral" />
                    <span>Loading…</span>
                  </>
                ) : (
                  emptyMessage
                )}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

SearchSelect.displayName = 'SearchSelect';

export { SearchSelect };
