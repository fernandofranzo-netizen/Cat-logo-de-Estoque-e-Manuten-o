import React, { useState, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import { StockItem, DatasheetResult, GroundingSource } from '../types';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Globe,
  Sparkles,
} from 'lucide-react';

interface DatasheetViewerProps {
  item: StockItem;
  isOpen: boolean;
  onClose: () => void;
}

export const DatasheetViewer: React.FC<DatasheetViewerProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DatasheetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch or generate datasheet via Google Grounding
  const fetchDatasheet = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
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
          setError(
            'A chave GEMINI_API_KEY não foi configurada. Acesse o menu Settings > Secrets para adicionar sua chave e habilitar a busca automática com Google Grounding.'
          );
        } else {
          setError(json.error || 'Erro ao gerar o data-sheet através do Google Grounding.');
        }
        setData(null);
      } else {
        setData({
          code: json.code || item.codigo,
          markdown: json.markdown,
          sources: json.sources || [],
          generatedAt: json.generatedAt || new Date().toISOString(),
          fromCache: json.fromCache,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro na comunicação com o servidor: ${msg}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (isOpen) {
      fetchDatasheet(false);
    }
  }, [isOpen, fetchDatasheet]);

  if (!isOpen) return null;

  // Handle Copy
  const handleCopy = async () => {
    if (!data?.markdown) return;
    try {
      await navigator.clipboard.writeText(data.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Handle Download File (.md)
  const handleDownloadFile = () => {
    if (!data?.markdown) return;
    const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DATASHEET_${item.codigo}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                  DATA-SHEET TÉCNICO // {item.codigo}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-teal-50 text-teal-700 border border-teal-200">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Google Grounding
                </span>
                {data?.fromCache && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-200/80 text-slate-600">
                    Em Cache
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 truncate uppercase mt-0.5">
                {item.descricao}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchDatasheet(true)}
              disabled={loading}
              title="Regerar via Google Grounding"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              FECHAR
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center animate-pulse">
                  <Globe className="w-6 h-6 animate-spin" />
                </div>
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-mono">
                  Consultando Especificações Oficiais via Google Grounding...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Pesquisando normas técnicas (DIN/ISO), tolerâncias dimensionais, tabelas de fabricantes e composições de materiais para o item <strong>{item.codigo}</strong>.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="font-bold text-sm">Não foi possível carregar a ficha técnica online</h3>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">{error}</p>
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => fetchDatasheet(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Technical Notice Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block font-mono">
                      DOCUMENTAÇÃO TÉCNICA HOMOLOGADA // MANUTAMAKI
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sincronizado e validado através do Google Grounding Search com catálogos de fornecedores e normas de engenharia.
                    </span>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadFile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    <span>Baixar Arquivo (.md)</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-mono font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    {copied ? (
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
                </div>
              </div>

              {/* Verified Sources / Grounding References */}
              {data.sources && data.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-mono font-bold text-sky-900 tracking-wide uppercase">
                      Fontes e Catálogos Consultados via Google Grounding ({data.sources.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {data.sources.map((src: GroundingSource, idx: number) => {
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
                          <span className="max-w-[200px] truncate font-medium">{src.title || hostname}</span>
                          <span className="text-[9px] text-sky-500 font-normal">({hostname})</span>
                          <ExternalLink className="w-3 h-3 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rendered Markdown Body */}
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs datasheet-content">
                <div className="markdown-body prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4">
                  <Markdown>{data.markdown}</Markdown>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
          <span>ALMOXARIFADO TÉCNICO // MANUTAMAKI PLANT</span>
          {data?.generatedAt && (
            <span>Gerado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
          )}
        </div>
      </div>
    </div>
  );
};
