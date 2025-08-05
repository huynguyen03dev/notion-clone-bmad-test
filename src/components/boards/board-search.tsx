'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, SortAsc, SortDesc, Calendar, Type, Clock } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface BoardSearchProps {
  onSearch: (search: string) => void;
  onSortChange: (sortBy: 'name' | 'createdAt' | 'updatedAt', sortOrder: 'asc' | 'desc') => void;
  currentSort: {
    sortBy: 'name' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
  };
}

export function BoardSearch({ onSearch, onSortChange, currentSort }: BoardSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);

  // Trigger search when debounced value changes (but not on initial mount)
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Use ref to store the onSearch function to prevent infinite loops
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    // Only trigger search if user has actually typed something
    if (hasUserTyped) {
      onSearchRef.current(debouncedSearch);
    }
  }, [debouncedSearch, hasUserTyped]); // Use ref to avoid onSearch dependency

  const getSortIcon = () => {
    return currentSort.sortOrder === 'asc' ? SortAsc : SortDesc;
  };

  const getSortLabel = () => {
    const labels = {
      name: 'Name',
      createdAt: 'Created',
      updatedAt: 'Updated',
    };
    return labels[currentSort.sortBy];
  };

  const getSortFieldIcon = (field: 'name' | 'createdAt' | 'updatedAt') => {
    switch (field) {
      case 'name':
        return Type;
      case 'createdAt':
        return Calendar;
      case 'updatedAt':
        return Clock;
    }
  };

  const handleSortChange = (sortBy: 'name' | 'createdAt' | 'updatedAt') => {
    // If clicking the same field, toggle order; otherwise use desc as default
    const sortOrder = currentSort.sortBy === sortBy && currentSort.sortOrder === 'desc' ? 'asc' : 'desc';
    onSortChange(sortBy, sortOrder);
  };

  return (
    <div className="flex gap-2 flex-1 max-w-md">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search boards..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setHasUserTyped(true);
          }}
          className="pl-10"
        />
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="shrink-0">
            {(() => {
              const SortIcon = getSortIcon();
              return <SortIcon className="h-4 w-4 mr-2" />;
            })()}
            {getSortLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {[
            { key: 'updatedAt' as const, label: 'Last Updated' },
            { key: 'createdAt' as const, label: 'Date Created' },
            { key: 'name' as const, label: 'Name' },
          ].map(({ key, label }) => {
            const Icon = getSortFieldIcon(key);
            const isActive = currentSort.sortBy === key;

            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleSortChange(key)}
                className={isActive ? 'bg-accent' : ''}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
                {isActive && (
                  <div className="ml-auto">
                    {currentSort.sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
