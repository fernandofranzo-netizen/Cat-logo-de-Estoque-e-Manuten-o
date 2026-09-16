import React, { useState } from 'react';
import { RequisitionItem } from '../types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Send,
} from 'lucide-react';

interface RequisitionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: RequisitionItem[];
  onUpdateQty: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearAll: () => void;
}

export const RequisitionDrawer: React.FC<RequisitionDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [sector, setSector] = useState('Manutenção Industrial');

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((acc, curr) => acc + curr.quantidade, 0);

  const generateRequisitionText = () => {
    const header = `========================================================\n` +
      `REQUISIÇÃO INTERNA DE ALMOXARIFADO / MANUTENÇÃO\n` +
      `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n` +
      `Solicitante: ${requesterName || 'Não especificado'}\n` +
      `Setor: ${sector}\n` +
      `Total de Itens: ${items.length} itens distintos (${totalItemsCount} unidades)\n` +
      `========================================================\n\n`;

    const body = items
      .map((req, idx) => {
        return `${idx + 1}. [${req.item.codigo}] - ${req.item.descricao}\n` +
          `   Qtd: ${req.quantidade} ${req.item.unidadeMedida || 'UN'} | Local Almox: ${req.item.localizacao}\n` +
          `   Categoria: ${req.item.categoria} / ${req.item.subCategoria}`;
      })
      .join('\n\n');

    return header + body + '\n\n========================================================';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateRequisitionText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleExportCSV = () => {
    const headers = 'Codigo;Descricao;Categoria;Subcategoria;Quantidade;Unidade;Localizacao\n';
    const rows = items
      .map((r) =>
        `"${r.item.codigo}";"${r.item.descricao.replace(/"/g, '""')}";"${r.item.categoria}";"${r.item.subCategoria}";${r.quantidade};"${r.item.unidadeMedida || 'UN'}";"${r.item.localizacao}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `requisicao_almoxarifado_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <h3 className="font-semibold text-sm tracking-wide">
              Lista de Requisição de Itens
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-mono text-sky-300">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata info */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
              Solicitante
            </label>
            <input
              type="text"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
              Setor Requisitante
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            >
              <option value="Manutenção Industrial">Manutenção Industrial</option>
              <option value="Manutenção Elétrica">Manutenção Elétrica</option>
              <option value="Manutenção Mecânica">Manutenção Mecânica</option>
              <option value="Produção">Produção</option>
              <option value="Utilidades">Utilidades</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <FileSpreadsheet className="w-12 h-12 stroke-[1.2] text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Nenhum item na requisição</p>
              <p className="text-xs max-w-xs text-slate-400">
                Navegue pelo catálogo ou pesquise itens e clique em "Adicionar à Requisição" para compor sua lista.
              </p>
            </div>
          ) : (
            items.map((req) => (
              <div
                key={req.item.id}
                className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-900 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      {req.item.codigo}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-800 mt-1 leading-tight">
                      {req.item.descricao}
                    </h4>
                  </div>
                  <button
                    onClick={() => onRemoveItem(req.item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remover item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="truncate max-w-[180px]" title={req.item.localizacao}>
                    {req.item.localizacao}
                  </span>
                  
                  {/* Quantity controls */}
                  <div className="flex items-center border border-slate-200 rounded bg-slate-50">
                    <button
                      onClick={() => onUpdateQty(req.item.id, Math.max(1, req.quantidade - 1))}
                      className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono font-bold text-xs text-slate-800 min-w-6 text-center">
                      {req.quantidade}
                    </span>
                    <button
                      onClick={() => onUpdateQty(req.item.id, req.quantidade + 1)}
                      className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
              <span>Total acumulado:</span>
              <span className="font-mono font-bold text-slate-900">
                {totalItemsCount} itens ({items.length} códigos)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Requisição</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            </div>

            <button
              onClick={onClearAll}
              className="w-full text-center text-[11px] text-rose-600 hover:text-rose-700 pt-1 font-medium transition-colors"
            >
              Limpar toda a lista
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
