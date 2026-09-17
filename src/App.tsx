import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StockItem, RequisitionItem, SyncStatus, SyncConfig } from './types';
import {
  getInitialStockItems,
  fetchFromGoogleAppsScript,
  fetchFromGoogleSheetsApi,
  DEFAULT_WEB_APP_URL,
} from './services/sheetsSync';
import {
  initAuth,
  googleSignIn,
  logout,
  getCachedAccessToken,
} from './services/firebaseAuth';
import { User } from 'firebase/auth';

import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ItemCard } from './components/ItemCard';
import { ItemTableView } from './components/ItemTableView';
import { ItemDetailView } from './components/ItemDetailView';
import { RequisitionDrawer } from './components/RequisitionDrawer';
import { AdminModal } from './components/AdminModal';
import { AdminView } from './components/AdminView';
import { PinModal } from './components/PinModal';
import { preloadDriveFolderIndex } from './services/driveImages';

import {
  Search,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const SPREADSHEET_DEFAULT_ID = 'AKfycbxFunUJdxpYKrEeuMQD_uiL1lzfqDdNj3U2kDBs7Ww_0MX0B1uzxbLA1Cc23h-S1LLv';
const ITEMS_PER_PAGE = 36;

export default function App() {
  // Inventory state
  const [items, setItems] = useState<StockItem[]>(() => getInitialStockItems());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Sync configuration
  const [config, setConfig] = useState<SyncConfig>(() => ({
    webAppUrl: DEFAULT_WEB_APP_URL,
    spreadsheetId: SPREADSHEET_DEFAULT_ID,
    autoSyncIntervalMs: 0, // Manual sync by default to prevent continuous background polling
    lastSyncTime: new Date(),
  }));

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // UI Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [sortOption, setSortOption] = useState('code-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers & Views
  const [activeView, setActiveView] = useState<'consulta' | 'admin'>('consulta');
  const [isGestorUnlocked, setIsGestorUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isRequisitionsOpen, setIsRequisitionsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Admin item updates
  const handleAddItem = (newItem: StockItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateItem = (updatedItem: StockItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
    );
  };

  const handleOpenAdmin = () => {
    if (isGestorUnlocked) {
      setActiveView('admin');
    } else {
      setIsPinModalOpen(true);
    }
  };

  // Requisitions Basket
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>(() => {
    try {
      const saved = localStorage.getItem('catalog_requisitions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('catalog_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save requisitions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('catalog_requisitions', JSON.stringify(requisitions));
    } catch (err) {
      console.error(err);
    }
  }, [requisitions]);

  // Save bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('catalog_bookmarks', JSON.stringify(Array.from(bookmarkedIds)));
    } catch (err) {
      console.error(err);
    }
  }, [bookmarkedIds]);

  // Preload Drive images index
  useEffect(() => {
    preloadDriveFolderIndex();
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
        setIsAuthenticated(true);
      },
      () => {
        setUser(null);
        setIsAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time synchronization core handler
  const performSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncErrorMsg(null);

    try {
      let updatedItems: StockItem[] = [];
      const token = getCachedAccessToken();

      // If user is authenticated with Google and provided a spreadsheet ID, try Sheets API first
      if (token && config.spreadsheetId) {
        try {
          updatedItems = await fetchFromGoogleSheetsApi(config.spreadsheetId, token);
        } catch (apiErr) {
          console.warn('Sheets API direct query failed, falling back to Apps Script Web App:', apiErr);
        }
      }

      // If Sheets API didn't return or not configured, use Web App bridge URL
      if (!updatedItems || updatedItems.length === 0) {
        try {
          updatedItems = await fetchFromGoogleAppsScript(config.webAppUrl);
        } catch (scriptErr) {
          console.warn('Google Apps Script bridge response notice:', scriptErr);
        }
      }

      if (updatedItems && updatedItems.length > 0) {
        setItems(updatedItems);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        // Keep existing catalog loaded and inform user
        setSyncStatus('idle');
        setSyncErrorMsg('Sincronização remota indisponível no momento. O catálogo local continua ativo.');
      }
    } catch (err: unknown) {
      console.warn('Synchronization notice:', err);
      setSyncStatus('idle');
      const message = err instanceof Error ? err.message : 'Falha na conexão com Google Sheets';
      setSyncErrorMsg(message);
    } finally {
      setIsSyncing(false);
    }
  }, [config.webAppUrl, config.spreadsheetId, isSyncing]);

  // Auto-sync timer based on interval
  useEffect(() => {
    if (config.autoSyncIntervalMs <= 0) return;

    const timer = setInterval(() => {
      performSync();
    }, config.autoSyncIntervalMs);

    return () => clearInterval(timer);
  }, [config.autoSyncIntervalMs, performSync]);

  // Auth actions
  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
      performSync();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Requisition actions
  const handleAddToRequisition = (item: StockItem, qty: number) => {
    setRequisitions((prev) => {
      const existingIdx = prev.findIndex((r) => r.item.id === item.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantidade: updated[existingIdx].quantidade + qty,
        };
        return updated;
      }
      return [...prev, { item, quantidade: qty }];
    });
  };

  const handleUpdateRequisitionQty = (itemId: string, newQty: number) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.item.id === itemId ? { ...r, quantidade: newQty } : r))
    );
  };

  const handleRemoveRequisition = (itemId: string) => {
    setRequisitions((prev) => prev.filter((r) => r.item.id !== itemId));
  };

  const handleClearRequisitions = () => {
    setRequisitions([]);
  };

  // Bookmark toggle
  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedGroup('');
    setSelectedSubCategory('');
    setCurrentPage(1);
  }, []);

  // Sub-category counts list for dropdown
  // If a Category is selected in the sidebar, show sub-categories within that category;
  // otherwise, show all sub-categories across the entire catalog.
  const subCategoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    const sourceItems = selectedCategory
      ? items.filter((it) => it.categoria?.toUpperCase() === selectedCategory.toUpperCase())
      : items;

    sourceItems.forEach((it) => {
      const sub = it.subCategoria?.trim();
      if (sub && sub.toUpperCase() !== 'OUTROS') {
        map.set(sub, (map.get(sub) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, selectedCategory]);

  // Filtered and Sorted Items
  const filteredItems = useMemo(() => {
    let result = items;

    // Category filter
    if (selectedCategory) {
      result = result.filter(
        (it) => it.categoria.toUpperCase() === selectedCategory.toUpperCase()
      );
    }

    // Sub-Category filter
    if (selectedSubCategory) {
      result = result.filter(
        (it) => it.subCategoria.toUpperCase() === selectedSubCategory.toUpperCase()
      );
    }

    // Search query filter (matches code, description, sub-category, extra, tags)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      const parts = query.split(/\s+/);

      result = result.filter((it) => {
        const fullText = `${it.codigo} ${it.descricao} ${it.descricaoExtra} ${it.categoria} ${it.subCategoria} ${it.materialSubGroup}`.toLowerCase();
        return parts.every((p) => fullText.includes(p));
      });
    }

    // Sort
    const sorted = [...result];
    switch (sortOption) {
      case 'code-asc':
        sorted.sort((a, b) => a.codigo.localeCompare(b.codigo));
        break;
      case 'code-desc':
        sorted.sort((a, b) => b.codigo.localeCompare(a.codigo));
        break;
      case 'desc-asc':
        sorted.sort((a, b) => a.descricao.localeCompare(b.descricao));
        break;
      case 'cat-asc':
        sorted.sort((a, b) => a.categoria.localeCompare(b.categoria));
        break;
      default:
        break;
    }

    return sorted;
  }, [items, selectedCategory, selectedSubCategory, searchTerm, sortOption]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, sortOption]);

  // Paginated slice
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        items={items}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubCategory('');
          setSelectedItem(null);
          setActiveView('consulta');
          setCurrentPage(1);
        }}
        selectedGroup={selectedGroup}
        onSelectGroup={(grp) => {
          setSelectedGroup(grp);
          setSelectedItem(null);
          setActiveView('consulta');
          setCurrentPage(1);
        }}
        onOpenAdmin={handleOpenAdmin}
        isAuthenticated={isAuthenticated}
        userEmail={user?.email}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isSyncing={isSyncing}
        onSyncNow={performSync}
        activeView={activeView}
        isGestorActive={isGestorUnlocked}
        onSelectView={(view) => {
          setActiveView(view);
          setSelectedItem(null);
        }}
      />

      {/* Main View: Item Detail OR Admin Console OR Public Catalog */}
      {selectedItem ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">
          <ItemDetailView
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
            onAddToRequisition={handleAddToRequisition}
          />
        </div>
      ) : activeView === 'admin' ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">
          <AdminView
            items={items}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onBackToCatalog={() => setActiveView('consulta')}
            onExitGestor={() => {
              setIsGestorUnlocked(false);
              setActiveView('consulta');
            }}
            config={config}
            onSaveConfig={(newConfig) => {
              setConfig(newConfig);
              performSync();
            }}
            onForceSync={performSync}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onSelectItemForDetail={(item) => setSelectedItem(item)}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <TopHeader
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

        {/* Sync Alert Banner if error occurs */}
        {syncStatus === 'error' && syncErrorMsg && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2 text-xs flex items-center justify-between text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Offline Ativo:</strong> Exibindo dados em cache ({items.length} itens disponíveis). {syncErrorMsg}
              </span>
            </div>
            <button
              onClick={performSync}
              disabled={isSyncing}
              className="text-amber-900 font-semibold underline hover:no-underline ml-4"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Main Body with Search & Results */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Search, Sub-Category & Sorting Bar */}
          <SearchFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedSubCategory={selectedSubCategory}
            onSubCategoryChange={(subCat) => {
              setSelectedSubCategory(subCat);
              setCurrentPage(1);
            }}
            subCategories={subCategoriesWithCounts}
            totalResults={filteredItems.length}
            totalCatalog={
              selectedCategory
                ? items.filter((it) => it.categoria?.toUpperCase() === selectedCategory.toUpperCase()).length
                : items.length
            }
            sortOption={sortOption}
            onSortChange={setSortOption}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedCategory={selectedCategory}
            onClearFilters={handleClearAllFilters}
          />

          {/* Catalog Items Display */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <PackageOpen className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Nenhum item técnico encontrado
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Não encontramos nenhum item correspondente aos filtros atuais "{searchTerm || selectedSubCategory || selectedCategory}".
                  Tente digitar o código, descrição ou limpar os filtros.
                </p>
              </div>
              <button
                onClick={handleClearAllFilters}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {paginatedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onOpenDetails={setSelectedItem}
                  onAddToRequisition={handleAddToRequisition}
                  isBookmarked={bookmarkedIds.has(item.id)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <ItemTableView
              items={paginatedItems}
              onOpenDetails={setSelectedItem}
              onAddToRequisition={handleAddToRequisition}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-200 text-xs text-slate-600">
              <span className="font-mono">
                Exibindo{' '}
                <strong>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                </strong>{' '}
                de <strong>{filteredItems.length}</strong> itens
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-1 text-slate-400 font-mono">...</span>
                  )}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700`}
                    >
                      {totalPages}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                  title="Próxima Página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      )}

      {/* Admin / PIN Config Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          performSync();
        }}
        totalItems={items.length}
        lastSyncTime={lastSyncTime}
        onForceSync={performSync}
        isSyncing={isSyncing}
        isAuthenticated={isAuthenticated}
        userEmail={user?.email}
      />

      {/* PIN Prompt Modal (Protected by 1234) */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsGestorUnlocked(true);
          setActiveView('admin');
          setIsPinModalOpen(false);
        }}
      />
    </div>
  );
}
