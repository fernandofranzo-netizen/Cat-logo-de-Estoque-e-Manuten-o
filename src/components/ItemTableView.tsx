import React, { useState } from 'react';
import { StockItem } from '../types';
import {
  Copy,
  Check,
  Plus,
  Eye,
  Bookmark,
  MapPin,
} from 'lucide-react';

interface ItemTableViewProps {
  items: StockItem[];
  onOpenDetails: (item: StockItem) => void;
  onAddToRequisition: (item: StockItem, qty: number) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
}

export const ItemTableView: React.FC<ItemTableViewProps> = ({
  items,
  onOpenDetails,
  onAddToRequisition,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (e: React.MouseEvent, codigo: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-3 w-10 text-center">Fav</th>
              <th className="py-3 px-4">Código Oficial</th>
              <th className="py-3 px-4">Descrição do Item</th>
              <th className="py-3 px-3">Categoria / Sub</th>
              <th className="py-3 px-3">Classificação</th>
              <th className="py-3 px-3">Localização Almoxarifado</th>
              <th className="py-3 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {items.map((item) => {
              const isFav = bookmarkedIds.has(item.id);
              const isCopied = copiedId === item.id;

              return (
                <tr
                  key={item.id}
                  onClick={() => onOpenDetails(item)}
                  className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                >
                  {/* Bookmark */}
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleBookmark(item.id)}
                      className={`p-1 rounded transition-colors ${
                        isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </td>

                  {/* Code */}
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sky-900 group-hover:text-sky-700">{item.codigo}</span>
                      <button
                        onClick={(e) => handleCopy(e, item.codigo, item.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copiar código"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="py-2.5 px-4 font-medium text-slate-800 max-w-sm">
                    <p className="line-clamp-2 leading-relaxed">{item.descricao}</p>
                    {item.descricaoExtra && (
                      <span className="text-[10px] text-amber-700 font-mono bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5 inline-block">
                        {item.descricaoExtra}
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 block truncate max-w-[130px]">
                        {item.categoria}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                        {item.subCategoria}
                      </span>
                    </div>
                  </td>

                  {/* Classification */}
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]" title={item.materialStructure}>
                    {item.materialSubGroup || item.materialStructure || 'Consumível'}
                  </td>

                  {/* Location */}
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.localizacao}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenDetails(item)}
                        className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-slate-100 rounded transition-colors"
                        title="Ver Ficha Técnica"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onAddToRequisition(item, 1)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 rounded text-[11px] font-semibold transition-colors"
                        title="Adicionar à requisição"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Requisitar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
