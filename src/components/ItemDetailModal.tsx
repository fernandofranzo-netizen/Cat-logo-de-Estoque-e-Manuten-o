import React, { useState } from 'react';
import { StockItem } from '../types';
import { TechnicalSchematic } from './TechnicalSchematic';
import {
  X,
  Copy,
  Check,
  MapPin,
  Tag,
  Layers,
  FileText,
  Plus,
  Minus,
  ShoppingCart,
  Printer,
  ExternalLink,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: StockItem | null;
  onClose: () => void;
  onAddToRequisition: (item: StockItem, qty: number) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onAddToRequisition,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedReq, setCopiedReq] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!item) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.codigo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const formattedRequisitionString = `[REQUISIÇÃO ALMOXARIFADO]
CÓDIGO: ${item.codigo}
DESCRIÇÃO: ${item.descricao} ${item.descricaoExtra ? `(${item.descricaoExtra})` : ''}
CATEGORIA: ${item.categoria} // ${item.subCategoria}
CLASSIFICAÇÃO: ${item.materialSubGroup || item.materialStructure || 'Consumível'}
LOCALIZAÇÃO: ${item.localizacao || 'Almoxarifado Central'}
QTD SOLICITADA: ${quantity} ${item.unidadeMedida || 'UN'}`;

  const handleCopyRequisition = async () => {
    try {
      await navigator.clipboard.writeText(formattedRequisitionString);
      setCopiedReq(true);
      setTimeout(() => setCopiedReq(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleAdd = () => {
    onAddToRequisition(item, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Ficha Técnica de Estoque
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Row: Visual CAD + Code & Main Description */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            <div className="sm:col-span-5 w-full h-44">
              <TechnicalSchematic
                codigo={item.codigo}
                subCategoria={item.subCategoria}
                categoria={item.categoria}
                descricao={item.descricao}
                className="w-full h-full"
              />
            </div>

            <div className="sm:col-span-7 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-sky-100 text-sky-800 border border-sky-200">
                  {item.categoria}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {item.subCategoria}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">Código do Item</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-xl font-mono font-bold text-slate-900 tracking-tight">
                    {item.codigo}
                  </h2>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 text-slate-500 hover:text-sky-600 rounded hover:bg-slate-100 transition-colors"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">Descrição Técnica</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-snug">
                  {item.descricao}
                </p>
                {item.descricaoExtra && (
                  <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mt-1.5 inline-block font-mono">
                    Obs: {item.descricaoExtra}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Localização Almoxarifado</span>
                <p className="text-xs font-semibold text-slate-800">{item.localizacao}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Sub Grupo de Material</span>
                <p className="text-xs font-medium text-slate-700">{item.materialSubGroup || 'Consumíveis de Produção'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Tag className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Classificação / Estrutura</span>
                <p className="text-xs font-medium text-slate-700 truncate" title={item.materialStructure}>
                  {item.materialStructure || 'Padrão Almoxarifado'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Unidade de Medida</span>
                <p className="text-xs font-medium text-slate-700">{item.unidadeMedida || 'UN (Unidade)'}</p>
              </div>
            </div>
          </div>

          {/* Requisition Action Box */}
          <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-950">
                  Adicionar à Lista de Requisição Interna
                </h4>
                <p className="text-[11px] text-slate-600">
                  Agrupe itens para gerar a requisição oficial para o setor de compras ou manutenção.
                </p>
              </div>
              <div className="flex items-center border border-slate-300 bg-white rounded-md shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1 font-mono text-xs font-bold text-slate-800 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {addedNotice ? 'Item Adicionado!' : `Adicionar (${quantity} ${item.unidadeMedida || 'UN'}) à Lista`}
              </button>

              <button
                onClick={handleCopyRequisition}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                title="Copiar texto formatado para e-mail, OS ou ERP"
              >
                {copiedReq ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar P/ Requisição</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>CATÁLOGO TÉCNICO // MANUTAMAKI</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>
    </div>
  );
};
