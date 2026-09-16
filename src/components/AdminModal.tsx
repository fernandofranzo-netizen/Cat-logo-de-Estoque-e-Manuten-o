import React, { useState } from 'react';
import { SyncConfig } from '../types';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  ExternalLink,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SyncConfig;
  onSaveConfig: (newConfig: SyncConfig) => void;
  totalItems: number;
  lastSyncTime: Date | null;
  onForceSync: () => Promise<void>;
  isSyncing: boolean;
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  totalItems,
  lastSyncTime,
  onForceSync,
  isSyncing,
  isAuthenticated,
  userEmail,
}) => {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Form states
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [syncInterval, setSyncInterval] = useState(config.autoSyncIntervalMs);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin === 'admin') {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      webAppUrl,
      spreadsheetId,
      autoSyncIntervalMs: syncInterval,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-sm tracking-wide">
              Administração & Configuração de Sincronização
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!unlocked ? (
          /* PIN Entry Screen */
          <div className="p-6">
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Acesso Restrito ao Gestor</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Digite o PIN de segurança para alterar parâmetros de sincronização em tempo real e endpoints da planilha.
                </p>
                <div className="text-[11px] font-mono text-sky-600 bg-sky-50 py-1 px-2 rounded inline-block">
                  PIN padrão do almoxarifado: <strong>1234</strong>
                </div>
              </div>

              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Digite o PIN (1234)"
                  autoFocus
                  className={`w-full px-4 py-2.5 text-center font-mono text-lg tracking-widest border rounded-lg focus:outline-none focus:ring-2 ${
                    pinError
                      ? 'border-rose-300 ring-rose-200 text-rose-700 bg-rose-50/50'
                      : 'border-slate-300 ring-sky-200 focus:border-sky-500'
                  }`}
                />
                {pinError && (
                  <p className="text-center text-xs text-rose-600 mt-1.5 font-medium">
                    PIN incorreto. Tente "1234".
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Acessar</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Panel */
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Status Summary */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Status Google OAuth</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  {isAuthenticated ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">{userEmail || 'Autenticado'}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Modo Público / API</span>
                    </>
                  )}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Total Sincronizado</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-sky-600" />
                  <span>{totalItems} itens ativos</span>
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="text"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Endpoint que sincroniza os dados da planilha de forma segura em tempo real.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Spreadsheet ID (Google Sheets)
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Identificador da planilha para consulta direta via API do Google Sheets.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intervalo de Sincronização Automática (Polling em tempo real)
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-sans text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value={15000}>A cada 15 segundos (Tempo Real contínuo)</option>
                  <option value={30000}>A cada 30 segundos (Recomendado)</option>
                  <option value={60000}>A cada 1 minuto</option>
                  <option value={300000}>A cada 5 minutos</option>
                  <option value={0}>Manual (Apenas ao clicar em Atualizar)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onForceSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Forçar Sincronização</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Configurações Salvas!</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
