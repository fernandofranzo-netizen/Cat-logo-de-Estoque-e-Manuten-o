import React, { useState } from 'react';
import { StockItem } from '../types';
import {
  Search,
  Box,
  Wrench,
  Shield,
  ChevronDown,
  ChevronRight,
  Lock,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  LogOut,
  LogIn,
  X,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarProps {
  items: StockItem[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedGroup: string;
  onSelectGroup: (grp: string) => void;
  onOpenAdmin: () => void;
  onOpenRequisitions: () => void;
  requisitionsCount: number;
  isAuthenticated: boolean;
  userEmail?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSyncing: boolean;
  onSyncNow: () => void;
  activeView?: 'consulta' | 'admin';
  isGestorActive?: boolean;
  onSelectView?: (view: 'consulta' | 'admin') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  selectedCategory,
  onSelectCategory,
  selectedGroup,
  onSelectGroup,
  onOpenAdmin,
  onOpenRequisitions,
  requisitionsCount,
  isAuthenticated,
  userEmail,
  onLogin,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  isSyncing,
  onSyncNow,
  activeView = 'consulta',
  isGestorActive = false,
  onSelectView,
}) => {
  const [openGeral, setOpenGeral] = useState(true);
  const [openManutencao, setOpenManutencao] = useState(true);

  const isManutencao = (cat: string) => {
    const c = cat.toUpperCase();
    return c.includes('ELETR') || c.includes('MECAN') || c.includes('GAS') || c.includes('MANUT');
  };

  // Get distinct categories with counts
  const categoryCounts: Record<string, number> = {};
  items.forEach((item) => {
    const cat = item.categoria?.trim();
    if (cat && cat.toUpperCase() !== 'OUTROS') {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  });

  const allCategories = Object.keys(categoryCounts)
    .filter((cat) => cat.toUpperCase() !== 'OUTROS' && cat.trim() !== '')
    .sort();

  const categoriasGeral = allCategories.filter((cat) => !isManutencao(cat));
  const categoriasManutencao = allCategories.filter((cat) => isManutencao(cat));

  const totalGeral = categoriasGeral.reduce((sum, cat) => sum + categoryCounts[cat], 0);
  const totalManutencao = categoriasManutencao.reduce((sum, cat) => sum + categoryCounts[cat], 0);

  // Friendly title formatter
  const formatCategoryName = (raw: string) => {
    return raw
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace('Producao', 'Produção')
      .replace('Eletrico', 'Elétrico')
      .replace('Mecanico', 'Mecânico')
      .replace('Seguranca', 'Segurança')
      .replace('Escritorio', 'Escritório')
      .replace('Gas', 'Gás');
  };

  const handleSelectAll = () => {
    onSelectCategory('');
    onSelectGroup('');
    if (onSelectView) onSelectView('consulta');
  };

  const content = (
    <div className="flex flex-col h-full bg-[#09101d] text-slate-300 select-none border-r border-slate-800/80 w-72 shrink-0">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/cm-logo.svg"
            alt="CM - Catálogo de Manutenção"
            width={34}
            height={34}
            className="w-8 h-8 rounded-lg shadow-sm shrink-0 object-contain"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-white tracking-widest uppercase">
                Catálogo
              </h1>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-800/50">
                v2.4
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              Manutenção // Almoxarifado
            </p>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* MODO GESTOR Banner when unlocked */}
      {isGestorActive && (
        <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 font-mono text-[10px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>MODO GESTOR</span>
          </div>
          <span className="text-amber-400 font-semibold tracking-wider">ATIVO</span>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
        <div>
          <span className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
            Navegação
          </span>
          <div className="mt-1 space-y-0.5">
            <button
              onClick={handleSelectAll}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                activeView === 'consulta' && selectedCategory === '' && selectedGroup === ''
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 opacity-80" />
                <span>Consulta de itens</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  activeView === 'consulta' && selectedCategory === '' && selectedGroup === ''
                    ? 'bg-sky-700/80 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {items.length}
              </span>
            </button>

            <button
              onClick={onOpenRequisitions}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-400 opacity-90" />
                <span>Lista de Requisições</span>
              </div>
              {requisitionsCount > 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {requisitionsCount}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 text-slate-500">0</span>
              )}
            </button>
          </div>
        </div>

        {/* Section: Consumo Geral */}
        <div className="space-y-1">
          <button
            onClick={() => setOpenGeral(!openGeral)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-400 hover:text-slate-200 font-medium"
          >
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-300">Consumo Geral</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono bg-sky-950 text-sky-400 px-1.5 py-0.2 rounded border border-sky-800/50">
                {totalGeral}
              </span>
              {openGeral ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          </button>

          {openGeral && (
            <div className="pl-3 space-y-0.5 border-l border-slate-800/80 ml-4">
              {categoriasGeral.map((cat) => {
                const isSelected = selectedCategory === cat && activeView === 'consulta';
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (onSelectView) onSelectView('consulta');
                      onSelectCategory(cat);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-1">{formatCategoryName(cat)}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Consumo Manutenção */}
        <div className="space-y-1">
          <button
            onClick={() => setOpenManutencao(!openManutencao)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-400 hover:text-slate-200 font-medium"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">Consumo Manutenção</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono bg-amber-950/80 text-amber-400 px-1.5 py-0.2 rounded border border-amber-800/50">
                {totalManutencao}
              </span>
              {openManutencao ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          </button>

          {openManutencao && (
            <div className="pl-3 space-y-0.5 border-l border-slate-800/80 ml-4">
              {categoriasManutencao.map((cat) => {
                const isSelected = selectedCategory === cat && activeView === 'consulta';
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (onSelectView) onSelectView('consulta');
                      onSelectCategory(cat);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-1">{formatCategoryName(cat)}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Administration Section */}
        <div className="pt-2 border-t border-slate-800/60">
          <span className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
            Administração
          </span>
          <div className="mt-1 space-y-0.5">
            <button
              onClick={onOpenAdmin}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                activeView === 'admin'
                  ? 'border-l-4 border-amber-500 bg-slate-800 text-white font-semibold pl-2 rounded-r-lg'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className={`w-3.5 h-3.5 ${activeView === 'admin' ? 'text-amber-400' : 'text-amber-400'}`} />
                <span>Administração</span>
              </div>
              {!isGestorActive && (
                <span className="text-[10px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/50 px-1.5 py-0.2 rounded">
                  PIN
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate" title={userEmail || ''}>
                    {userEmail || 'Acesso Gestor'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-[10px] text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                  title="Sair da Conta Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors text-left"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span>Acesso Gestor (Google)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070c16] text-[10px] font-mono flex items-center justify-between text-slate-500">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          <span>MANUTAMAKI // USO INTERNO</span>
        </div>
        <button
          onClick={onSyncNow}
          disabled={isSyncing}
          className="hover:text-slate-300 p-1"
          title="Sincronizar agora"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
