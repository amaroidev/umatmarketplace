import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Tag, TrendingUp } from 'lucide-react';
import productService from '../../services/product.service';

interface SearchSuggestion {
  title: string;
  type: 'product' | 'tag';
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  onClose?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className = '',
  placeholder = 'Search for textbooks, electronics, food...',
  onSearch,
  autoFocus = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popularSearches = [
    'Textbooks',
    'Laptops',
    'Calculators',
    'Food',
    'Phone accessories',
    'Past questions',
  ];

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await productService.getSearchSuggestions(q.trim(), 8);
      if (res.success) {
        setSuggestions(res.data);
      }
    } catch {
      // Suggestions are helpful, but not critical.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setShowSuggestions(false);
    setQuery(q);

    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items =
      query.trim().length >= 2
        ? suggestions
        : popularSearches.map((item) => ({ title: item, type: 'product' as const }));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        performSearch(items[selectedIndex].title);
      } else {
        performSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
      onClose?.();
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const displayItems =
    query.trim().length >= 2
      ? suggestions
      : popularSearches.map((item) => ({ title: item, type: 'product' as const }));

  const showDropdown = showSuggestions && (displayItems.length > 0 || loading);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input searchbar-input border-earth-300 bg-earth-50 pl-10 pr-10 text-earth-900 placeholder:text-earth-400"
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-500 transition-colors hover:text-earth-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="searchbar-panel absolute left-0 right-0 top-full z-[100] mt-1 max-h-80 overflow-y-auto border border-earth-300 bg-earth-50 shadow-lg">
          {loading && query.trim().length >= 2 && (
            <div className="searchbar-loading flex items-center gap-2 px-4 py-2 text-sm text-earth-500">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-earth-300 border-t-clay-500" />
              Searching...
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="searchbar-header flex items-center gap-1.5 border-b border-earth-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-earth-500">
              <TrendingUp className="h-3 w-3" />
              Popular Searches
            </div>
          )}

          {displayItems.map((item, index) => (
            <button
              key={`${item.type}-${item.title}-${index}`}
              className={`searchbar-item flex w-full items-center gap-3 border-b border-earth-200 px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-earth-100 text-clay-700'
                  : 'text-earth-700 hover:bg-earth-100'
              }`}
              onClick={() => performSearch(item.title)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {item.type === 'tag' ? (
                <Tag className="h-4 w-4 flex-shrink-0 text-earth-400" />
              ) : (
                <Search className="h-4 w-4 flex-shrink-0 text-earth-400" />
              )}
              <span className="truncate">{item.title}</span>
              {item.type === 'tag' && (
                <span className="ml-auto flex-shrink-0 text-xs uppercase tracking-wide text-earth-400">tag</span>
              )}
            </button>
          ))}

          {!loading && query.trim().length >= 2 && suggestions.length === 0 && (
            <div className="searchbar-empty px-4 py-3 text-center text-sm text-earth-500">
              No suggestions found. Press Enter to search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
