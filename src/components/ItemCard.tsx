import React, { useState } from 'react';
import { StockItem } from '../types';
import { TechnicalSchematic } from './TechnicalSchematic';
import {
  Copy,
  Check,
  Plus,
  FileText,
  MapPin,
  Bookmark,
  Share2,
} from 'lucide-react';

interface ItemCardProps {
  item: StockItem;
  onOpenDetails: (item: StockItem) => void;
  onAddToRequisition: (item: StockItem, qty: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: (itemId: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onOpenDetails,
  onAddToRequisition,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToRequisition(item, 1);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(item.id);
  };

  // Format dimensions extract
  const extractDimensions = () => {
    const d = item.descricao;
    const match = d.match(/(\d+[,.]?\d*\s*[Xx]\s*\d+[,.]?\d*(\s*[Xx]\s*\d+[,.]?\d*)?\s*(MM|M|G)?)/i);
    if (match) return match[0];
    if (item.descricaoExtra) return item.descricaoExtra;
    return null;
  };

  const dimensionText = extractDimensions();

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* CAD Schematic Header with Top Action Icons */}
      <div className="relative w-full h-44 bg-slate-50 border-b border-slate-100">
        <TechnicalSchematic
          codigo={item.codigo}
          subCategoria={item.subCategoria}
          categoria={item.categoria}
          descricao={item.descricao}
          className="w-full h-full"
        />

        {/* Floating Quick Action Icons */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-md bg-white/90 hover:bg-white text-slate-500 hover:text-sky-700 border border-slate-200/80 shadow-xs transition-colors"
            title="Copiar código do item"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-md border shadow-xs transition-colors ${
              isBookmarked
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500 border-slate-200/80'
            }`}
            title={isBookmarked ? 'Remover dos favoritos' : 'Favoritar item'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Category & Subcategory Tags */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
              {item.categoria}
            </span>
            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {item.subCategoria}
            </span>
          </div>

          {/* Official Code */}
          <div className="flex items-center justify-between mt-2.5">
            <h3 className="text-sm font-mono font-bold text-slate-900 tracking-tight group-hover:text-sky-700 transition-colors">
              {item.codigo}
            </h3>
            {copied && (
              <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Copiado!
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-slate-700 font-semibold mt-1 line-clamp-2 leading-relaxed">
            {item.descricao}
          </p>

          {/* Extra Dimension Spec */}
          {dimensionText && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              <span>{dimensionText}</span>
            </div>
          )}
        </div>

        {/* Card Footer with Location and Requisition Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate" title={item.localizacao}>
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.localizacao}</span>
          </div>

          <button
            onClick={handleAdd}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-semibold text-[11px] transition-colors"
            title="Adicionar à requisição"
          >
            <Plus className="w-3 h-3" />
            <span>Requisitar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
