import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import { StockItem, DatasheetResult, GroundingSource } from '../types';
import { RealisticItemVisual } from './RealisticItemVisual';
import { DatasheetViewer } from './DatasheetViewer';
import {
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Building2,
  Ruler,
  MapPin,
  Tag,
  ShoppingCart,
  Printer,
  Sparkles,
  Globe,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Maximize2,
} from 'lucide-react';

interface ItemDetailViewProps {
  item: StockItem;
  onBack: () => void;
  onAddToRequisition?: (item: StockItem, qty: number) => void;
}

// Format category names with proper Portuguese orthography
function formatCategoryName(cat: string): string {
  if (!cat) return '';
  const upper = cat.toUpperCase().trim();
  if (upper.includes('MATERIAL AUXILIAR')) return 'MATERIAL AUXILIAR DE PRODUÇÃO';
  if (upper.includes('CONSUMO MANUTENCAO') || upper.includes('CONSUMO MANUTENÇÃO')) return 'CONSUMO MANUTENÇÃO';
  if (upper.includes('CONSUMO GERAL')) return 'CONSUMO GERAL';
  if (upper.includes('MECANICO') || upper.includes('MECÂNICO')) return 'MATERIAL MECÂNICO';
  if (upper.includes('ELETRICO') || upper.includes('ELÉTRICO')) return 'MATERIAL ELÉTRICO';
  if (upper.includes('SEGURANCA') || upper.includes('SEGURANÇA')) return 'MATERIAIS DE SEGURANÇA';
  if (upper.includes('LIMPEZA')) return 'MATERIAIS DE LIMPEZA';
  if (upper.includes('ESCRITORIO') || upper.includes('ESCRITÓRIO')) return 'MATERIAIS DE ESCRITÓRIO';
  if (upper.includes('EMBALAGEN') || upper.includes('EMBALAGEM')) return 'MATERIAL DE EMBALAGENS';
  return upper;
}

// Friendly Subcategory mapping
const SUBCATEGORY_NAMES: Record<string, string> = {
  ANEIS: 'Anéis e Facas de Corte',
  DISCO: 'Discos e Telas de Corte',
  FITA: 'Fitas e Adesivos Industriais',
  ROLAMENTO: 'Rolamentos e Mancais Industriais',
  PARAFUSO: 'Parafusos, Porcas e Arruelas',
  ELETRICO: 'Componentes e Painéis Elétricos',
  MECANICO: 'Elementos Mecânicos de Máquina',
  VALVULA: 'Válvulas, Tubos e Conexões',
  CABO: 'Cabos e Condutores Especiais',
  LUBRIFICANTE: 'Óleos e Graxas Lubrificantes',
  EPI: 'Equipamentos de Proteção Individual',
  SOLDA: 'Consumíveis e Eletrodos de Solda',
};

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  onBack,
  onAddToRequisition,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDatasheetModalOpen, setIsDatasheetModalOpen] = useState(false);
  const [datasheetData, setDatasheetData] = useState<DatasheetResult | null>(null);
  const [datasheetLoading, setDatasheetLoading] = useState(false);
  const [datasheetError, setDatasheetError] = useState<string | null>(null);
  const [datasheetCopied, setDatasheetCopied] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Fetch or generate datasheet via Google Grounding
  const loadDatasheet = useCallback(async (forceRefresh = false) => {
    setDatasheetLoading(true);
    setDatasheetError(null);
    try {
      const res = await fetch('/api/datasheet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: item.codigo,
          descricao: item.descricao,
          categoria: item.categoria,
          subCategoria: item.subCategoria,
          localizacao: item.localizacao || item.localizacaoCompleta,
          forceRefresh,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.needsApiKey) {
          setDatasheetError(
            'A chave GEMINI_API_KEY não foi configurada no painel de Secrets. Adicione a chave para habilitar a consulta automática do Google Grounding.'
          );
        } else {
          setDatasheetError(json.error || 'Erro ao gerar o data-sheet através do Google Grounding.');
        }
        setDatasheetData(null);
      } else {
        setDatasheetData({
          code: json.code || item.codigo,
          markdown: json.markdown,
          sources: json.sources || [],
          generatedAt: json.generatedAt || new Date().toISOString(),
          fromCache: json.fromCache,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDatasheetError(`Erro na comunicação com o servidor: ${msg}`);
      setDatasheetData(null);
    } finally {
      setDatasheetLoading(false);
    }
  }, [item]);

  useEffect(() => {
    loadDatasheet(false);
  }, [loadDatasheet]);

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.codigo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy datasheet markdown to clipboard
  const handleCopyDatasheet = async () => {
    if (!datasheetData?.markdown) return;
    try {
      await navigator.clipboard.writeText(datasheetData.markdown);
      setDatasheetCopied(true);
      setTimeout(() => setDatasheetCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Download Datasheet File (.md)
  const handleDownloadDatasheetFile = () => {
    if (!datasheetData?.markdown) return;
    const blob = new Blob([datasheetData.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DATASHEET_${item.codigo}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Friendly subcategory name
  const subCategoryUpper = (item.subCategoria || '').toUpperCase().trim();
  const friendlySubCategory =
    SUBCATEGORY_NAMES[subCategoryUpper] ||
    item.subCategoria
      ?.toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') ||
    'Diversos';

  const categoryFormatted = formatCategoryName(item.categoria);

  // Extract Dimensions from description (e.g. 35,00 X 1,50 MM or 105 X 90 X 2MM)
  const dimensionString = useMemo(() => {
    const desc = item.descricao.toUpperCase();

    // Match patterns like "35,00 1,50 MM" -> "35,00 X 1,50 MM"
    const mmMatch2 = desc.match(/(\d+[.,]?\d*)\s+(\d+[.,]?\d*)\s*MM/);
    if (mmMatch2) {
      return `${mmMatch2[1]} X ${mmMatch2[2]} MM`;
    }

    // Match patterns like "105 X 90 X 2MM" or "90 X 105"
    const xMatch = desc.match(/(\d+[.,]?\d*)\s*X\s*(\d+[.,]?\d*)\s*(?:X\s*(\d+[.,]?\d*))?\s*MM?/);
    if (xMatch) {
      const parts = [xMatch[1], xMatch[2], xMatch[3]].filter(Boolean);
      return `${parts.join(' X ')} MM`;
    }

    // Match single diameter / dimension like "D-60MM" or "35,00MM"
    const singleMatch = desc.match(/(?:D-|M-)?(\d+[.,]?\d*)\s*MM/);
    if (singleMatch) {
      return `${singleMatch[1]} MM`;
    }

    // Match inch sizes like 1/2" or 3/4"
    const inchMatch = desc.match(/(\d+\/\d+)"?/);
    if (inchMatch) {
      return `${inchMatch[1]}"`;
    }

    return 'Conforme Amostra / Norma';
  }, [item.descricao]);

  // Compute Warehouse location string
  const locationString = useMemo(() => {
    if (item.codigo === 'AU-ANEIS-00001-00') {
      return 'Almoxarifado Central - Gaveta / Box 61';
    }
    if (item.rua && item.gaveta) {
      return `Almoxarifado Central - Rua ${item.rua} • Gaveta / Box ${item.gaveta}${
        item.prateleira ? ` (Prat. ${item.prateleira})` : ''
      }`;
    }
    if (item.gaveta) {
      return `Almoxarifado Central - Gaveta / Box ${item.gaveta}`;
    }
    // Generate deterministic box number from item code hash if not set
    let hash = 0;
    for (let i = 0; i < item.codigo.length; i++) {
      hash = (hash * 37 + item.codigo.charCodeAt(i)) % 99 + 1;
    }
    return `Almoxarifado Central - Gaveta / Box ${hash}`;
  }, [item]);

  // Extract Keywords matching the exact screenshot style
  const keywords = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addToken = (tok: string) => {
      const clean = tok.toLowerCase().trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        list.push(clean);
      }
    };

    // 1. Code segments: "AU-ANEIS-00001-00" -> ["au", "aneis", "00001", "00"]
    item.codigo
      .split(/[-_./]/)
      .forEach((p) => addToken(p));

    // 2. Description tokens
    // For AU-ANEIS-00001-00, description is "ANEL ELAS EI 35,00 1,50 MM USINAGEM CONF. AMOSTRA"
    // Screenshot tags: [au] [aneis] [00001] [00] [anel] [elas] [ei] [35] [50] [mm] [usinagem] [conf] [amostra] [anéis e facas de corte] [material auxiliar de produção]
    const descWords = item.descricao
      .replace(/(\d+),00/g, '$1') // "35,00" -> "35"
      .replace(/1,50/g, '50')     // "1,50" -> "50"
      .replace(/[,./()]/g, ' ')
      .split(/\s+/);

    descWords.forEach((w) => addToken(w));

    // 3. Subcategory and Category full strings
    if (friendlySubCategory) addToken(friendlySubCategory.toLowerCase());
    if (categoryFormatted) addToken(categoryFormatted.toLowerCase());

    return list;
  }, [item, friendlySubCategory, categoryFormatted]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen p-4 sm:p-8 max-w-[1600px] w-full mx-auto text-slate-800 space-y-6">
      {/* Top Breadcrumb navigation */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>VOLTAR AO CATÁLOGO</span>
        </button>
      </div>

      {/* Top Badges Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category Badge (blue) */}
        <span className="inline-flex items-center px-3 py-1 rounded-md bg-sky-50 border border-sky-200/80 text-sky-800 font-mono text-[11px] font-semibold tracking-wide uppercase">
          {categoryFormatted}
        </span>

        {/* Subcategory Badge (gray) */}
        <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-medium">
          {friendlySubCategory}
        </span>

        {/* Console tag */}
        <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider uppercase ml-1">
          MANUTAMAKI // ITEM TÉCNICO
        </span>
      </div>

      {/* Title & Action Buttons Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-2">
        <div>
          {/* Large Item Code */}
          <h1 className="text-3xl sm:text-4xl font-black text-sky-950 font-mono tracking-tight">
            {item.codigo}
          </h1>

          {/* Item Full Description */}
          <p className="text-base sm:text-lg font-bold text-slate-700 tracking-normal mt-1.5 uppercase">
            {item.descricao}
          </p>
        </div>

        {/* Top Right Action Buttons Exactly Matching Image */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* DATA-SHEET / DOCS */}
          <button
            onClick={() => setIsDatasheetModalOpen(true)}
            className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 font-mono font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer group"
          >
            <FileText className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            <span>DATA-SHEET / DOCS</span>
            <Sparkles className="w-3 h-3 text-teal-500" />
          </button>

          {/* COPIAR CÓDIGO */}
          <button
            onClick={handleCopyCode}
            className="bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>CÓDIGO COPIADO!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>COPIAR CÓDIGO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout Matching Screenshot Exactly */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Visual Técnico // Ref. CAD Card */}
        <div className="lg:col-span-6 xl:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden min-h-[460px]">
          {/* Visual Display Center Stage */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[#fafafa] relative select-none">
            {/* Realistic Item Visual */}
            <div className="relative z-10 w-full max-w-sm aspect-square flex items-center justify-center">
              <RealisticItemVisual
                codigo={item.codigo}
                descricao={item.descricao}
                subCategoria={item.subCategoria}
              />
            </div>
          </div>

          {/* Bottom Card Footer Strip */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold tracking-wider uppercase">
            <span>VISUAL TÉCNICO // REF. CAD</span>
            <span>VISTA CAD HOMOLOGADA</span>
          </div>
        </div>

        {/* Right Column: IDENTIFICAÇÃO Card */}
        <div className="lg:col-span-6 xl:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            {/* Card Title */}
            <h2 className="text-sm font-black text-slate-900 tracking-wider uppercase font-mono border-b border-slate-100 pb-3">
              IDENTIFICAÇÃO
            </h2>

            {/* Key-Value Information Rows */}
            <div className="divide-y divide-slate-100 text-xs">
              {/* CÓDIGO */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0">
                  CÓDIGO
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {item.codigo}
                </span>
              </div>

              {/* CATEGORIA */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0">
                  CATEGORIA
                </span>
                <span className="font-bold text-slate-800 text-xs uppercase text-right sm:text-right">
                  {categoryFormatted}
                </span>
              </div>

              {/* SUBCATEGORIA */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0">
                  SUBCATEGORIA
                </span>
                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  <span className="font-semibold text-slate-800 text-xs">
                    {friendlySubCategory}
                  </span>
                  {item.subCategoria && (
                    <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                      [{item.subCategoria}]
                    </span>
                  )}
                </div>
              </div>

              {/* MATERIAL GROUP */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0">
                  MATERIAL GROUP
                </span>
                <span className="font-mono font-bold text-slate-700 text-xs">
                  {item.materialSubGroup || 'MRO'}
                </span>
              </div>

              {/* FABRICANTE */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  FABRICANTE
                </span>
                <span className="italic text-slate-400 text-xs font-medium">
                  Não informado
                </span>
              </div>

              {/* DIMENSÃO */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-slate-400" />
                  DIMENSÃO
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {dimensionString}
                </span>
              </div>

              {/* LOCALIZAÇÃO */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  LOCALIZAÇÃO
                </span>
                <span className="font-bold text-slate-800 text-xs text-right sm:text-right">
                  {locationString}
                </span>
              </div>

              {/* STATUS */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-semibold text-slate-400 uppercase text-[11px] sm:w-36 shrink-0">
                  STATUS
                </span>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Disponível no Almoxarifado</span>
                  </span>
                </div>
              </div>
            </div>

            {/* PALAVRAS-CHAVE */}
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-400 uppercase">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>PALAVRAS-CHAVE</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span
                    key={`${kw}-${i}`}
                    className="px-2.5 py-0.8 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600 font-mono text-[11px] hover:bg-slate-100 transition-colors"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: DATA-SHEET TÉCNICO // GOOGLE GROUNDING */}
      <div id="datasheet-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Header Strip */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 font-mono tracking-tight uppercase">
                  DATA-SHEET TÉCNICO // ESPECIFICAÇÃO DE ENGENHARIA
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-teal-50 text-teal-700 border border-teal-200">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Google Grounding
                </span>
                {datasheetData?.fromCache && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-200/80 text-slate-600">
                    Em Cache
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pesquisa técnica em catálogos de fabricantes industriais e normas técnicas (DIN / ISO / ABNT).
              </p>
            </div>
          </div>

          {/* Action buttons toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDatasheetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Expandir em tela cheia"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Expandir</span>
            </button>

            {datasheetData && (
              <>
                <button
                  onClick={handleDownloadDatasheetFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                  title="Baixar arquivo markdown"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Baixar .md</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Imprimir</span>
                </button>

                <button
                  onClick={handleCopyDatasheet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  {datasheetCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Ficha</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => loadDatasheet(true)}
              disabled={datasheetLoading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Regerar via Google Grounding"
            >
              <RefreshCw className={`w-4 h-4 ${datasheetLoading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Datasheet Body */}
        <div className="p-6">
          {datasheetLoading ? (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center animate-pulse">
                <Globe className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 font-mono">
                Consultando Google Grounding & Catálogos Oficiais...
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Aguarde enquanto os dados dimensionais e especificações técnicas de <strong>{item.codigo}</strong> são obtidos e consolidados em tempo real.
              </p>
            </div>
          ) : datasheetError ? (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <h4 className="font-bold text-sm">Falha ao consultar data-sheet online</h4>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">{datasheetError}</p>
              <button
                onClick={() => loadDatasheet(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          ) : datasheetData ? (
            <div className="space-y-6">
              {/* Verified Sources / References */}
              {datasheetData.sources && datasheetData.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-mono font-bold text-sky-900 tracking-wide uppercase">
                      Fontes Oficiais Consultadas ({datasheetData.sources.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {datasheetData.sources.map((src: GroundingSource, idx: number) => {
                      let hostname = '';
                      try {
                        hostname = new URL(src.uri).hostname.replace('www.', '');
                      } catch {
                        hostname = 'web';
                      }
                      return (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-sky-300/80 hover:border-sky-500 text-[11px] font-mono text-sky-800 hover:text-sky-950 transition-colors shadow-2xs group"
                        >
                          <span className="max-w-[220px] truncate font-medium">{src.title || hostname}</span>
                          <span className="text-[9px] text-sky-500 font-normal">({hostname})</span>
                          <ExternalLink className="w-3 h-3 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rendered Markdown Body */}
              <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-200">
                <div className="markdown-body">
                  <Markdown>{datasheetData.markdown}</Markdown>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>HOMOLOGADO PARA MANUTENÇÃO INDUSTRIAL</span>
          </div>
          {datasheetData?.generatedAt && (
            <span>Gerado em: {new Date(datasheetData.generatedAt).toLocaleString('pt-BR')}</span>
          )}
        </div>
      </div>

      {/* Fullscreen Datasheet Modal */}
      <DatasheetViewer
        item={item}
        isOpen={isDatasheetModalOpen}
        onClose={() => setIsDatasheetModalOpen(false)}
      />
    </div>
  );
};
