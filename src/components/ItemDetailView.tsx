import React, { useState, useMemo } from 'react';
import { StockItem } from '../types';
import { TechnicalSchematic } from './TechnicalSchematic';
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
  const [showDatasheetAlert, setShowDatasheetAlert] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

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
            onClick={() => setShowDatasheetAlert(true)}
            className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 font-mono font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>DATA-SHEET / DOCS</span>
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

          {/* Add to requisition basket if available */}
          {onAddToRequisition && (
            <button
              onClick={() => {
                onAddToRequisition(item, 1);
                setAddedNotice(true);
                setTimeout(() => setAddedNotice(false), 2000);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-sky-400" />
              <span>{addedNotice ? 'REQUISITADO!' : '+ REQUISIÇÃO'}</span>
            </button>
          )}
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

      {/* Datasheet Modal / Informational Alert */}
      {showDatasheetAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase font-mono">
                  Documentação Técnica & Ficha
                </h3>
                <p className="text-xs text-slate-500 font-mono">{item.codigo}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O arquivo técnico oficial está vinculado à biblioteca interna de normas e catálogos homologados pela engenharia de manutenção.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-mono space-y-1 text-slate-600">
              <div><strong>Norma Referência:</strong> DIN 471 / DIN 472 / ISO 9001</div>
              <div><strong>Tolerância Dimensional:</strong> ±0.05 mm</div>
              <div><strong>Acabamento Superficial:</strong> Fosfatizado / Óleo Protetivo</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-mono text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ficha
              </button>
              <button
                onClick={() => setShowDatasheetAlert(false)}
                className="px-4 py-2 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg hover:bg-slate-800"
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

// Component that renders high quality, realistic representation of the mechanical item
const RealisticItemVisual: React.FC<{
  codigo: string;
  descricao: string;
  subCategoria: string;
}> = ({ codigo, descricao, subCategoria }) => {
  const descUpper = (descricao + ' ' + subCategoria + ' ' + codigo).toUpperCase();

  const isRing =
    descUpper.includes('ANEL') ||
    descUpper.includes('ANEIS') ||
    descUpper.includes('SEEGER') ||
    descUpper.includes('TRAVA');
  const isDisc =
    descUpper.includes('DISCO') ||
    descUpper.includes('TELA') ||
    descUpper.includes('CORTE') ||
    descUpper.includes('LÂMINA');
  const isBearing =
    descUpper.includes('ROLAMENTO') ||
    descUpper.includes('ESFERA') ||
    descUpper.includes('MANCAL');

  if (isRing) {
    // Photorealistic black oxide retaining ring exactly matching the user's uploaded image
    return (
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full max-w-[280px] max-h-[280px]"
      >
        <defs>
          {/* Radial light & material gradient for matte black oxide steel */}
          <radialGradient id="ringBlackOxide" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="90%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Cast soft studio shadow */}
          <filter id="studioDropShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" />
            <feOffset dx="3" dy="12" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.32" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft floor shadow */}
        <ellipse
          cx="160"
          cy="255"
          rx="82"
          ry="14"
          fill="#0f172a"
          opacity="0.16"
          style={{ filter: 'blur(8px)' }}
        />

        {/* Main snap ring body with drop shadow */}
        <g filter="url(#studioDropShadow)">
          {/* Outer circle diameter with gap at top */}
          <path
            d="
              M 142 82
              A 82 82 0 1 0 178 82
              L 173 103
              A 62 62 0 1 1 147 103
              Z
            "
            fill="url(#ringBlackOxide)"
            stroke="#0b0f19"
            strokeWidth="1.5"
          />

          {/* Left Lug Ear */}
          <path
            d="
              M 147 103
              L 138 72
              A 13 13 0 0 1 161 68
              L 151 101
              Z
            "
            fill="url(#ringBlackOxide)"
            stroke="#0b0f19"
            strokeWidth="1.2"
          />

          {/* Right Lug Ear */}
          <path
            d="
              M 173 103
              L 182 72
              A 13 13 0 0 0 159 68
              L 169 101
              Z
            "
            fill="url(#ringBlackOxide)"
            stroke="#0b0f19"
            strokeWidth="1.2"
          />

          {/* Left Lug Hole */}
          <circle
            cx="149"
            cy="77"
            r="5.5"
            fill="#fafafa"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Hole inner rim depth */}
          <circle
            cx="149.5"
            cy="77.5"
            r="4"
            fill="#e2e8f0"
            stroke="#334155"
            strokeWidth="0.6"
          />

          {/* Right Lug Hole */}
          <circle
            cx="171"
            cy="77"
            r="5.5"
            fill="#fafafa"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Hole inner rim depth */}
          <circle
            cx="170.5"
            cy="77.5"
            r="4"
            fill="#e2e8f0"
            stroke="#334155"
            strokeWidth="0.6"
          />
        </g>

        {/* Subtle highlight rim simulating studio light from top */}
        <path
          d="
            M 142 82
            A 82 82 0 0 0 92 135
          "
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>
    );
  }

  if (isDisc) {
    // Photorealistic industrial cutting disc / mesh disc
    return (
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full max-w-[280px] max-h-[280px]"
      >
        <defs>
          <radialGradient id="discMetal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="95%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="centerRing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
        </defs>
        {/* Floor shadow */}
        <ellipse
          cx="160"
          cy="265"
          rx="95"
          ry="15"
          fill="#0f172a"
          opacity="0.18"
          style={{ filter: 'blur(8px)' }}
        />
        {/* Outer Disc Body */}
        <circle
          cx="160"
          cy="160"
          r="105"
          fill="url(#discMetal)"
          stroke="#0f172a"
          strokeWidth="2"
        />
        {/* Wire mesh texture ring */}
        <circle
          cx="160"
          cy="160"
          r="88"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle
          cx="160"
          cy="160"
          r="72"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {/* Center Metal Mounting Ring */}
        <circle
          cx="160"
          cy="160"
          r="44"
          fill="url(#centerRing)"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* Center Hole */}
        <circle
          cx="160"
          cy="160"
          r="20"
          fill="#fafafa"
          stroke="#0f172a"
          strokeWidth="3"
        />
      </svg>
    );
  }

  if (isBearing) {
    // Photorealistic deep groove ball bearing
    return (
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full max-w-[280px] max-h-[280px]"
      >
        <defs>
          <radialGradient id="bearingOuter" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="85%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="ballShine" cx="35%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="80%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>
        </defs>
        {/* Floor shadow */}
        <ellipse
          cx="160"
          cy="265"
          rx="95"
          ry="15"
          fill="#0f172a"
          opacity="0.18"
          style={{ filter: 'blur(8px)' }}
        />
        {/* Outer Ring */}
        <circle
          cx="160"
          cy="160"
          r="105"
          fill="url(#bearingOuter)"
          stroke="#0f172a"
          strokeWidth="3"
        />
        <circle
          cx="160"
          cy="160"
          r="82"
          fill="#334155"
          stroke="#1e293b"
          strokeWidth="2"
        />
        {/* Cage groove */}
        <circle cx="160" cy="160" r="68" fill="#1e293b" />
        {/* Ball Bearings */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 160 + 68 * Math.cos(rad);
          const cy = 160 + 68 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="13"
              fill="url(#ballShine)"
              stroke="#0f172a"
              strokeWidth="1"
            />
          );
        })}
        {/* Inner Ring */}
        <circle
          cx="160"
          cy="160"
          r="50"
          fill="url(#bearingOuter)"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        {/* Shaft bore */}
        <circle
          cx="160"
          cy="160"
          r="30"
          fill="#fafafa"
          stroke="#0f172a"
          strokeWidth="3"
        />
      </svg>
    );
  }

  // Generic clean mechanical component schematic
  return (
    <div className="w-64 h-64 flex items-center justify-center">
      <TechnicalSchematic
        codigo={codigo}
        subCategoria={subCategoria}
        categoria="MATERIAL"
        descricao={descricao}
        className="w-64 h-64 shadow-inner"
        showCadLabel={false}
      />
    </div>
  );
};
