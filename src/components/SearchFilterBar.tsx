import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedSubCategory: string;
  onSubCategoryChange: (subCat: string) => void;
  subCategories: { name: string; count: number }[];
  totalResults: number;
  totalCatalog: number;
  sortOption: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectedCategory?: string;
  onClearFilters: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedSubCategory,
  onSubCategoryChange,
  subCategories,
  totalResults,
  totalCatalog,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCategory,
  onClearFilters,
}) => {
  const hasActiveFilters = Boolean(searchTerm || selectedSubCategory || selectedCategory);

  return (
    <div className="space-y-4">
      {/* Top Main Search Input & Sub-Category Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Código, descrição ou palavra-chave (ex: 6204, SKF, M8, Festo, ANEIS)..."
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all shadow-2xs font-medium text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              title="Limpar texto de pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub-Category Selector */}
        <div className="sm:w-80">
          <div className="relative">
            <select
              value={selectedSubCategory}
              onChange={(e) => onSubCategoryChange(e.target.value)}
              className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 shadow-2xs cursor-pointer"
            >
              <option value="">Todas as sub-categorias ({totalCatalog})</option>
              {subCategories.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.count})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            RESULTADO DA CONSULTA
          </span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-sm font-bold text-slate-800 font-mono">
              <span className="text-sky-700">{totalResults}</span> itens encontrados
              {selectedCategory && (
                <span className="text-xs font-sans text-slate-500 font-normal ml-1">
                  em <strong className="text-slate-700 font-medium">"{selectedCategory}"</strong>
                </span>
              )}
              {selectedSubCategory && (
                <span className="text-xs font-sans text-slate-500 font-normal ml-1">
                  • Sub-categoria: <strong className="text-slate-700 font-medium">"{selectedSubCategory}"</strong>
                </span>
              )}
            </p>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Sorting */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="code-asc">Código (A-Z)</option>
              <option value="code-desc">Código (Z-A)</option>
              <option value="desc-asc">Descrição (A-Z)</option>
              <option value="cat-asc">Categoria</option>
            </select>
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Grade (Cards com CAD)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Lista / Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
