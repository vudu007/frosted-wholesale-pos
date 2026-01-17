import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function FilterSidebar({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
  ];

  return (
    <>
      {/* Backdrop - Mobile Only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:sticky top-0 left-0 h-full lg:h-auto w-80 bg-white dark:bg-slate-900 border-r lg:border-r-0 lg:border-none border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none z-40 transform transition-transform duration-300 ease-out lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full lg:h-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-bold">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Categories
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategoryChange(category);
                    // Close on mobile after selection
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Sort By
            </h3>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="input-field"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range - Optional for future */}
          <div className="space-y-3 opacity-50 pointer-events-none">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Price Range (Coming Soon)
            </h3>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="10000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full"
                disabled
              />
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>₦{priceRange[0]}</span>
                <span>₦{priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => {
              onCategoryChange('All');
              onSortChange('name-asc');
            }}
            className="w-full py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </>
  );
}
