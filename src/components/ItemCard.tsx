import React, { useState } from 'react';
import { StockItem } from '../types';
import { RealisticItemVisual } from './RealisticItemVisual';
import {
  Copy,
  Check,
  Heart,
  ArrowRight,
} from 'lucide-react';

interface ItemCardProps {
  item: StockItem;
  onOpenDetails: (item: StockItem) => void;
  onAddToRequisition: (item: StockItem, qty: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: (itemId: string) => void;
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

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onOpenDetails,
  onAddToRequisition: _onAddToRequisition,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(item.id);
  };

  // Format category
  const categoryFormatted = formatCategoryName(item.categoria);

  // Format dimensions extract
  const extractDimensions = () => {
    const desc = item.descricao.toUpperCase();

    const mmMatch2 = desc.match(/(\d+[.,]?\d*)\s+(\d+[.,]?\d*)\s*MM/);
    if (mmMatch2) {
      return `${mmMatch2[1]} X ${mmMatch2[2]} MM`;
    }

    const xMatch = desc.match(/(\d+[.,]?\d*)\s*X\s*(\d+[.,]?\d*)\s*(?:X\s*(\d+[.,]?\d*))?\s*MM?/);
    if (xMatch) {
      const parts = [xMatch[1], xMatch[2], xMatch[3]].filter(Boolean);
      return `${parts.join(' X ')} MM`;
    }

    const singleMatch = desc.match(/(?:D-|M-)?(\d+[.,]?\d*)\s*MM/);
    if (singleMatch) {
      return `${singleMatch[1]} MM`;
    }

    const inchMatch = desc.match(/(\d+\/\d+)"?/);
    if (inchMatch) {
      return `${inchMatch[1]}"`;
    }

    if (item.descricaoExtra) return item.descricaoExtra;
    return null;
  };

  const dimensionText = extractDimensions();

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col p-4 cursor-pointer justify-between space-y-3.5"
    >
      {/* Visual Reference Frame with Top Action Icons */}
      <div className="relative w-full aspect-[4/3] bg-[#fafafa] rounded-xl border border-slate-200/70 overflow-hidden flex items-center justify-center p-3 select-none">
        {/* Realistic CAD / Visual Component */}
        <div className="w-full h-full flex items-center justify-center">
          <RealisticItemVisual
            codigo={item.codigo}
            subCategoria={item.subCategoria}
            descricao={item.descricao}
            className="max-w-[180px] max-h-[180px]"
          />
        </div>

        {/* Top-Right Action Icons Matching Screenshot */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-400 hover:text-slate-800 border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
            title="Copiar código"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg border shadow-2xs transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-rose-50 border-rose-200 text-rose-500'
                : 'bg-white/90 hover:bg-white text-slate-300 hover:text-rose-500 border-slate-200/80'
            }`}
            title={isBookmarked ? 'Remover dos favoritos' : 'Favoritar item'}
          >
            <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom-Left Reference Label */}
        <span className="absolute bottom-2.5 left-3 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
          VISTA DE REFERÊNCIA
        </span>
      </div>

      {/* Card Information Body */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Category Tag */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] font-semibold tracking-wide uppercase">
              {categoryFormatted}
            </span>
          </div>

          {/* Code */}
          <h3 className="text-base font-mono font-black text-slate-900 tracking-tight group-hover:text-sky-800 transition-colors">
            {item.codigo}
          </h3>

          {/* Description */}
          <p className="text-xs font-bold text-slate-700 uppercase line-clamp-2 leading-relaxed">
            {item.descricao}
          </p>

          {/* Dimension Spec */}
          {dimensionText && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
              <span>{dimensionText}</span>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons Row Matching Reference Image */}
        <div className="flex items-center gap-2 pt-2">
          {/* COPIAR CÓDIGO Button */}
          <button
            onClick={handleCopyCode}
            className={`flex-1 flex items-center justify-center gap-2 font-mono font-bold text-xs py-2.5 px-4 rounded-xl border shadow-2xs transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] border-[#fcd34d]'
            }`}
            title="Copiar código do item"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span>CÓDIGO COPIADO!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#b45309]" />
                <span>COPIAR CÓDIGO</span>
              </>
            )}
          </button>

          {/* Arrow / Open Details Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(item);
            }}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 shadow-2xs transition-all cursor-pointer"
            title="Ver detalhes do item"
          >
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

