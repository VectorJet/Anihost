'use client';

import { cn } from '@/lib/utils';
import { getSearchSuggestions } from '@/lib/api'; // Import API
import { useRouter } from 'next/navigation'; // Import useRouter

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Search,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Removed Shortcut interface and components

interface SearchResult {
  icon: React.ReactNode;
  label: string;
  description: string;
  link: string;
}

const SVGFilter = () => {
  return (
    <svg width="0" height="0">
      <filter id="blob">
        <feGaussianBlur stdDeviation="10" in="SourceGraphic" />
        <feColorMatrix
          values="
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      0 0 0 18 -9
    "
          result="blob"
        />
        <feBlend in="SourceGraphic" in2="blob" />
      </filter>
    </svg>
  );
};

interface ShortcutButtonProps {
  icon: React.ReactNode;
  link: string;
}

const ShortcutButton = ({ icon, link }: ShortcutButtonProps) => {
  return (
    <a href={link} target="_blank">
      <div className="rounded-full cursor-pointer hover:shadow-lg opacity-30 hover:opacity-100 transition-[opacity,shadow] duration-200">
        <div className="size-16 aspect-square flex items-center justify-center">{icon}</div>
      </div>
    </a>
  );
};

interface SpotlightPlaceholderProps {
  text: string;
  className?: string;
}

const SpotlightPlaceholder = ({ text, className }: SpotlightPlaceholderProps) => {
  return (
    <motion.div
      layout
      className={cn('absolute text-gray-500 flex items-center pointer-events-none z-10', className)}
    >
      <AnimatePresence mode="popLayout">
        <motion.p
          layoutId={`placeholder-${text}`}
          key={`placeholder-${text}`}
          initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};

interface SpotlightInputProps {
  placeholder: string;
  hidePlaceholder: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholderClassName?: string;
}

const SpotlightInput = ({
  placeholder,
  hidePlaceholder,
  value,
  onChange,
  onSubmit,
  placeholderClassName
}: SpotlightInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when the component mounts
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(value);
    }
  };

  return (
    <div className="flex items-center w-full justify-start gap-2 px-4 h-12 md:px-6 md:h-16">
      <motion.div layoutId="search-icon">
        <Search />
      </motion.div>
      <div className="flex-1 relative text-lg md:text-2xl">
        {!hidePlaceholder && (
          <SpotlightPlaceholder text={placeholder} className={placeholderClassName} />
        )}

        <motion.input
          ref={inputRef}
          layout="position"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none ring-none"
        />
      </div>
    </div>
  );
};

interface SearchResultCardProps extends SearchResult {
  isLast: boolean;
}

const SearchResultCard = ({ icon, label, description, link, isLast }: SearchResultCardProps) => {
  return (
    <a href={link} target="_blank" className="overflow-hidden w-full group/card">
      <div
        className={cn(
          'flex items-center text-black dark:text-white justify-start hover:bg-white dark:hover:bg-neutral-700 gap-3 py-2 px-2 rounded-xl hover:shadow-md w-full',
          isLast && 'rounded-b-3xl'
        )}
      >
        <div className="size-8 [&_svg]:stroke-[1.5] [&_svg]:size-6 aspect-square flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="font-medium">{label}</p>
          <p className="text-xs opacity-50">{description}</p>
        </div>
        <div className="flex-1 flex items-center justify-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <ChevronRight className="size-6" />
        </div>
      </div>
    </a>
  );
};

interface SearchResultsContainerProps {
  searchResults: SearchResult[];
  onHover: (index: number | null) => void;
}

const SearchResultsContainer = ({ searchResults, onHover }: SearchResultsContainerProps) => {
  return (
    <motion.div
      layout
      onMouseLeave={() => onHover(null)}
      className="px-2 border-t flex flex-col bg-neutral-100 dark:bg-neutral-800 max-h-60 md:max-h-96 overflow-y-auto w-full py-2"
    >
      {searchResults.map((result, index) => {
        return (
          <motion.div
            key={`search-result-${index}`}
            onMouseEnter={() => onHover(index)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.2,
              ease: 'easeOut'
            }}
          >
            <SearchResultCard
              icon={result.icon}
              label={result.label}
              description={result.description}
              link={result.link}
              isLast={index === searchResults.length - 1}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

interface AppleSpotlightProps {
  isOpen?: boolean;
  handleClose?: () => void;
}

const AppleSpotlight = ({
  isOpen = true,
  handleClose = () => {}
}: AppleSpotlightProps) => {
  const router = useRouter();
  const [hoveredSearchResult, setHoveredSearchResult] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = (value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
      handleClose();
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchValue.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      try {
        const suggestions = await getSearchSuggestions(searchValue);
        const mappedResults = suggestions.map((item) => ({
          icon: (
            <div className="relative w-full h-full overflow-hidden rounded">
              <img src={item.poster} alt={item.name} className="w-full h-full object-cover" />
            </div>
          ),
          label: item.name,
          description: item.moreInfo.join(' • '),
          link: `/anime/${item.id}`
        }));
        setSearchResults(mappedResults);
      } catch (error) {
        console.error("Failed to fetch search suggestions", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  return (
    <AnimatePresence mode="wait">

      {isOpen && (
        <motion.div
          initial={{
            opacity: 0,
            filter: 'blur(20px) url(#blob)',
            scaleX: 1.3,
            scaleY: 1.1,
            y: -10
          }}
          animate={{
            opacity: 1,
            filter: 'blur(0px) url(#blob)',
            scaleX: 1,
            scaleY: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            filter: 'blur(20px) url(#blob)',
            scaleX: 1.3,
            scaleY: 1.1,
            y: 10
          }}
          transition={{
            stiffness: 550,
            damping: 50,
            type: 'spring'
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-24 md:justify-center md:pt-0"
          onClick={handleClose}
        >
          <SVGFilter />

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ filter: 'url(#blob)' }}
              className={cn(
                'w-[90%] md:w-full flex items-center justify-center gap-4 z-20 group',
                '[&>div]:bg-neutral-100 dark:[&>div]:bg-neutral-800 [&>div]:text-black dark:[&>div]:text-white [&>div]:rounded-full [&>div]:backdrop-blur-xl',
                '[&_svg]:size-5 md:[&_svg]:size-7 [&_svg]:stroke-[1.4]',
                'max-w-3xl'
              )}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                layoutId="search-input-container"
                transition={{
                  layout: {
                    duration: 0.5,
                    type: 'spring',
                    bounce: 0.2
                  }
                }}
                style={{
                  borderRadius: '30px'
                }}
                className="h-full w-full flex flex-col items-center justify-start z-10 relative shadow-lg overflow-hidden border"
              >
                <SpotlightInput
                  placeholder={
                    hoveredSearchResult !== null
                      ? searchResults[hoveredSearchResult].label
                      : 'Search'
                  }
                  placeholderClassName={
                    hoveredSearchResult !== null ? 'text-black bg-white' : 'text-gray-500'
                  }
                  hidePlaceholder={!(hoveredSearchResult !== null || !searchValue)}
                  value={searchValue}
                  onChange={handleSearchValueChange}
                  onSubmit={handleSearchSubmit}
                />

                {searchValue && (
                  <SearchResultsContainer
                    searchResults={searchResults}
                    onHover={setHoveredSearchResult}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { AppleSpotlight };
