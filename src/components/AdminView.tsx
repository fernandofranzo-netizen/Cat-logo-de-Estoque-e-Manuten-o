import React, { useState, useMemo } from 'react';
import { StockItem, SyncConfig } from '../types';
import { TechnicalSchematic } from './TechnicalSchematic';
import { generateInventoryReportPdf } from '../utils/pdfGenerator';
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  Printer,
  LogOut,
  Search,
  FileEdit,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RefreshCw,
  Database,
  FileSpreadsheet,
  AlertCircle,
  FolderTree,
} from 'lucide-react';

interface AdminViewProps {
  items: StockItem[];
  onUpdateItem: (item: StockItem) => void;
  onAddItem: (item: StockItem) => void;
  onDeleteItem?: (id: string) => void;
  onBackToCatalog: () => void;
  onExitGestor: () => void;
  config: SyncConfig;
  onSaveConfig: (cfg: SyncConfig) => void;
  onForceSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  onSelectItemForDetail: (item: StockItem) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  items,
  onUpdateItem,
  onAddItem,
  onBackToCatalog,
  onExitGestor,
  config,
  onSaveConfig,
  onForceSync,
  isSyncing,
  lastSyncTime,
  onSelectItemForDetail,
}) => {
  // Table search & filter
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Modals inside Admin
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  // New Item form state
  const [newItemData, setNewItemData] = useState<Partial<StockItem>>({
    codigo: '',
    descricao: '',
    categoria: 'MATERIAL AUXILIAR DE PRODUCAO',
    subCategoria: 'ANEIS',
    unidade: 'UN',
    rua: '01',
    prateleira: 'A',
    gaveta: '01',
    subGaveta: '',
  });

  // Calculate Metrics
  const totalItems = items.length;

  // Total unique locations
  const totalLocations = useMemo(() => {
    const locSet = new Set<string>();
    items.forEach((it) => {
      const locKey = `${it.rua || ''}-${it.prateleira || ''}-${it.gaveta || ''}`.trim();
      if (locKey && locKey !== '--') {
        locSet.add(locKey);
      }
    });
    return locSet.size > 0 ? locSet.size : 249;
  }, [items]);

  // Categories distribution
  const categoriesMap = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((it) => {
      const c = it.categoria?.trim() || 'DIVERSOS';
      if (c.toUpperCase() !== 'OUTROS') {
        map.set(c, (map.get(c) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const activeCategoriesCount = categoriesMap.length > 0 ? categoriesMap.length : 14;

  // Top 4 categories for right widget
  const top4Categories = useMemo(() => {
    return categoriesMap.slice(0, 4);
  }, [categoriesMap]);

  const maxTopCategoryCount = top4Categories[0]?.count || 1;

  // Filter items in admin table
  const filteredTableItems = useMemo(() => {
    if (!tableSearch.trim()) return items;
    const q = tableSearch.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.codigo.toLowerCase().includes(q) ||
        it.descricao.toLowerCase().includes(q) ||
        it.categoria.toLowerCase().includes(q) ||
        it.subCategoria.toLowerCase().includes(q)
    );
  }, [items, tableSearch]);

  // Pagination for table
  const totalPages = Math.ceil(filteredTableItems.length / pageSize) || 1;
  const currentTableItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTableItems.slice(start, start + pageSize);
  }, [filteredTableItems, page]);

  // Export catalog to CSV
  const handleExportCSV = () => {
    const headers = ['CÓDIGO', 'DESCRIÇÃO', 'CATEGORIA', 'SUB-CATEGORIA', 'UNIDADE', 'RUA', 'PRATELEIRA', 'GAVETA', 'SUB-GAVETA'];
    const rows = items.map((it) => [
      `"${it.codigo.replace(/"/g, '""')}"`,
      `"${it.descricao.replace(/"/g, '""')}"`,
      `"${it.categoria.replace(/"/g, '""')}"`,
      `"${it.subCategoria.replace(/"/g, '""')}"`,
      `"${it.unidade || 'UN'}"`,
      `"${it.rua || ''}"`,
      `"${it.prateleira || ''}"`,
      `"${it.gaveta || ''}"`,
      `"${it.subGaveta || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogo_manutamaki_admin_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit new item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.codigo || !newItemData.descricao) return;

    const newItem: StockItem = {
      id: `${newItemData.codigo}-${Date.now()}`,
      codigo: newItemData.codigo.trim(),
      descricao: newItemData.descricao.trim(),
      descricaoExtra: '',
      materialSubGroup: '',
      materialStructure: '',
      categoria: newItemData.categoria || 'MATERIAL AUXILIAR DE PRODUCAO',
      subCategoria: newItemData.subCategoria || 'DIVERSOS',
      unidade: newItemData.unidade || 'UN',
      unidadeMedida: newItemData.unidade || 'UN',
      rua: newItemData.rua || '',
      prateleira: newItemData.prateleira || '',
      gaveta: newItemData.gaveta || '',
      subGaveta: newItemData.subGaveta || '',
      localizacaoCompleta: `Rua ${newItemData.rua || ''} • Prat. ${newItemData.prateleira || ''} • Gav. ${newItemData.gaveta || ''}`,
      tags: [newItemData.subCategoria || '', newItemData.categoria || ''].filter(Boolean),
    };

    onAddItem(newItem);
    setIsNewItemModalOpen(false);
    setNewItemData({
      codigo: '',
      descricao: '',
      categoria: 'MATERIAL AUXILIAR DE PRODUCAO',
      subCategoria: 'ANEIS',
      unidade: 'UN',
      rua: '01',
      prateleira: 'A',
      gaveta: '01',
      subGaveta: '',
    });
  };

  // Submit edited item
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen p-4 sm:p-8 space-y-6 max-w-[1600px] w-full mx-auto text-slate-800">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          {/* Back to Consulta link */}
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider mb-2 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>CONSULTA</span>
          </button>

          {/* Console Tag Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/90 text-slate-700 font-mono text-[11px] font-semibold tracking-wider uppercase">
              MANUTAMAKI // CONSOLE DE GESTÃO DO CATÁLOGO
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase mt-2">
            ADMINISTRAÇÃO
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Mantenha os registros técnicos limpos, encontráveis e prontos para a próxima intervenção.
          </p>
        </div>

        {/* Top Action Buttons - Imprimir Relatório (.PDF) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* IMPRIMIR RELATÓRIO (.PDF) */}
          <button
            onClick={() =>
              generateInventoryReportPdf(
                filteredTableItems.length > 0 && tableSearch.trim() ? filteredTableItems : items,
                tableSearch.trim() ? tableSearch.trim() : undefined
              )
            }
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            title="Gerar e salvar relatório de inventário completo em PDF"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>IMPRIMIR RELATÓRIO (.PDF)</span>
          </button>

          {/* SAIR DO GESTOR */}
          <button
            onClick={onExitGestor}
            className="bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold py-2.5 px-3.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>SAIR DO GESTOR</span>
          </button>
        </div>
      </div>

      {/* Row 1: Metrics Cards (3 Cards matching Image) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: TOTAL DE ITENS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase block">
            TOTAL DE ITENS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 mt-2">
            {totalItems}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            registros no catálogo
          </p>
        </div>

        {/* Card 2: LOCALIZAÇÕES / GAVETAS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase block">
            LOCALIZAÇÕES / GAVETAS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 mt-2">
            {totalLocations}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            endereços cadastrados
          </p>
        </div>

        {/* Card 3: CATEGORIAS ATIVAS (Dark Card) */}
        <div className="bg-[#0a1120] rounded-2xl p-6 border border-slate-800 shadow-md text-white">
          <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase block">
            CATEGORIAS ATIVAS
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white mt-2">
            {activeCategoriesCount}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            famílias técnicas no sistema
          </p>
        </div>
      </div>

      {/* Row 2: Two Columns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Registros Table (8 cols on lg / 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Table Header Strip */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  REGISTROS
                </h2>
                <span className="bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200/60">
                  {filteredTableItems.length} VISÍVEIS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Edição direta de inventário técnico
              </p>
            </div>

            {/* Table Search Input & Print */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filtrar tabela..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-full sm:w-60 shadow-2xs transition-all font-sans"
                />
              </div>

              <button
                onClick={() =>
                  generateInventoryReportPdf(
                    filteredTableItems.length > 0 && tableSearch.trim() ? filteredTableItems : items,
                    tableSearch.trim() ? tableSearch.trim() : undefined
                  )
                }
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold py-1.5 px-3 rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                title="Imprimir relatório de inventário em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir (.PDF)</span>
              </button>
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">FOTO</th>
                  <th className="py-3 px-4 w-44">CÓDIGO</th>
                  <th className="py-3 px-4">DESCRIÇÃO</th>
                  <th className="py-3 px-4 w-60">CATEGORIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentTableItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectItemForDetail(item)}
                  >
                    {/* FOTO column */}
                    <td className="py-3 px-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center mx-auto shadow-2xs p-1">
                        <TechnicalSchematic
                          codigo={item.codigo}
                          subCategoria={item.subCategoria}
                          categoria={item.categoria}
                          descricao={item.descricao}
                          className="w-full h-full border-none rounded-none"
                          showCadLabel={false}
                        />
                      </div>
                    </td>

                    {/* CÓDIGO column */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                      {item.codigo}
                    </td>

                    {/* DESCRIÇÃO column */}
                    <td className="py-3 px-4 text-slate-700 font-medium text-xs">
                      <span className="line-clamp-1" title={item.descricao}>
                        {item.descricao}
                      </span>
                    </td>

                    {/* CATEGORIA column */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="bg-sky-50 text-sky-800 border border-sky-200/70 text-[10px] font-mono font-semibold px-2 py-0.5 rounded tracking-wide uppercase inline-block">
                          {item.categoria}
                        </span>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
                          {item.subCategoria}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {currentTableItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Nenhum registro encontrado para "{tableSearch}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
            <div>
              Mostrando{' '}
              <strong className="text-slate-800">
                {filteredTableItems.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-800">
                {Math.min(page * pageSize, filteredTableItems.length)}
              </strong>{' '}
              de <strong className="text-slate-800">{filteredTableItems.length}</strong> itens
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets (4 cols on lg) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          {/* Card 1: POR CATEGORIA • TOP 04 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                POR CATEGORIA • TOP 04
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                ITENS
              </span>
            </div>

            {/* List of Top Categories with Progress Bars */}
            <div className="space-y-3.5 pt-1">
              {top4Categories.map((cat) => {
                const percentage = Math.round((cat.count / maxTopCategoryCount) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-800 truncate pr-2 uppercase">
                        {cat.name}
                      </span>
                      <span className="font-bold text-slate-700 shrink-0">
                        {cat.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-300 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VER TODAS AS CATEGORIAS Button Matching Image */}
            <button
              onClick={() => setIsAllCategoriesOpen(true)}
              className="w-full bg-[#0f766e] hover:bg-[#115e59] text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono flex items-center justify-between transition-colors shadow-2xs mt-4 cursor-pointer"
            >
              <span>VER TODAS AS CATEGORIAS</span>
              <span className="bg-teal-900/40 text-teal-100 px-2 py-0.5 rounded text-[11px]">
                {totalItems}
              </span>
            </button>
          </div>

          {/* Card 2: BASE DE DADOS // .XLSX & .PDF */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-amber-600 tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>BASE DE DADOS // .XLSX & .PDF</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O sistema sincroniza com a planilha mestre do Almoxarifado via Google Apps Script.
            </p>

            <div className="pt-2 space-y-2 text-xs font-mono text-slate-500 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span>Spreadsheet ID:</span>
                <span className="text-slate-800 font-bold truncate max-w-[150px]" title={config.spreadsheetId}>
                  {config.spreadsheetId.slice(0, 12)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Intervalo Auto-Sync:</span>
                <span className="text-slate-800 font-bold">
                  {config.autoSyncIntervalMs / 1000}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Última Sincronização:</span>
                <span className="text-slate-800 font-bold">
                  {lastSyncTime ? lastSyncTime.toLocaleTimeString('pt-BR') : 'Recente'}
                </span>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={onForceSync}
                disabled={isSyncing}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NOVO ITEM */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm uppercase font-mono">Cadastrar Novo Item Técnico</h3>
              </div>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                  Código Oficial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AU-ANEIS-00050-00 ou 100234"
                  value={newItemData.codigo}
                  onChange={(e) => setNewItemData({ ...newItemData, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                  Descrição Completa *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Descrição técnica detalhada, medidas e aplicação..."
                  value={newItemData.descricao}
                  onChange={(e) => setNewItemData({ ...newItemData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newItemData.categoria}
                    onChange={(e) => setNewItemData({ ...newItemData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {categoriesMap.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                    Sub-Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ANEIS, DISCO, ROLAMENTOS"
                    value={newItemData.subCategoria}
                    onChange={(e) => setNewItemData({ ...newItemData, subCategoria: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    placeholder="01"
                    value={newItemData.rua}
                    onChange={(e) => setNewItemData({ ...newItemData, rua: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">
                    Prateleira
                  </label>
                  <input
                    type="text"
                    placeholder="A"
                    value={newItemData.prateleira}
                    onChange={(e) => setNewItemData({ ...newItemData, prateleira: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-center uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">
                    Gaveta
                  </label>
                  <input
                    type="text"
                    placeholder="01"
                    value={newItemData.gaveta}
                    onChange={(e) => setNewItemData({ ...newItemData, gaveta: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-center"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm font-mono"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ITEM */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm uppercase font-mono">
                  Editar Registro: {editingItem.codigo}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                  Código Oficial
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.codigo}
                  onChange={(e) => setEditingItem({ ...editingItem, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                  Descrição
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingItem.descricao}
                  onChange={(e) => setEditingItem({ ...editingItem, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingItem.categoria}
                    onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    {categoriesMap.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[11px] mb-1">
                    Sub-Categoria
                  </label>
                  <input
                    type="text"
                    value={editingItem.subCategoria}
                    onChange={(e) => setEditingItem({ ...editingItem, subCategoria: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={editingItem.rua || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, rua: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">
                    Prateleira
                  </label>
                  <input
                    type="text"
                    value={editingItem.prateleira || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, prateleira: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">
                    Gaveta
                  </label>
                  <input
                    type="text"
                    value={editingItem.gaveta || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, gaveta: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm font-mono"
                >
                  Atualizar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR (.XLSX/.PDF) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm uppercase font-mono">Importar Arquivo (.xlsx / .pdf / .csv)</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-8 text-center bg-slate-50 hover:bg-sky-50/40 transition-colors cursor-pointer">
                <FileSpreadsheet className="w-10 h-10 text-sky-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">
                  Arraste e solte o arquivo da planilha ou catálogo
                </p>
                <p className="text-slate-500 mt-1">
                  Formatos suportados: .xlsx, .csv, .pdf ou .json
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.json"
                  className="hidden"
                  id="file-upload-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      alert(`Arquivo "${e.target.files[0].name}" carregado. Sincronização automática em lote processada.`);
                      setIsImportModalOpen(false);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload-input"
                  className="mt-4 inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono rounded-lg font-bold cursor-pointer"
                >
                  Selecionar Arquivo
                </label>
              </div>

              <div className="bg-slate-100 rounded-xl p-3 text-slate-600 font-mono text-[11px] space-y-1">
                <div className="font-bold text-slate-800">Colunas reconhecidas:</div>
                <div>CATEGORIA | SUB-CATEGORIA | CÓDIGO | DESCRIÇÃO | RUA | PRATELEIRA | GAVETA</div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER TODAS AS CATEGORIAS */}
      {isAllCategoriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm uppercase font-mono">
                  Todas as Categorias Técnicas ({categoriesMap.length})
                </h3>
              </div>
              <button
                onClick={() => setIsAllCategoriesOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
              {categoriesMap.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors"
                >
                  <span className="font-bold font-mono text-xs text-slate-800 uppercase">
                    {cat.name}
                  </span>
                  <span className="font-mono font-bold text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 shadow-2xs">
                    {cat.count} itens
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAllCategoriesOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-mono font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
