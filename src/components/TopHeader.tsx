import React from 'react';
import { SyncStatus } from '../types';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  ShoppingCart,
  Shield,
  Sliders,
  LogIn,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  onSyncNow: () => void;
  isSyncing: boolean;
  syncIntervalMs: number;
  onChangeSyncInterval: (interval: number) => void;
  requisitionsCount: number;
  onOpenRequisitions: () => void;
  isAuthenticated: boolean;
  userEmail?: string | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
  syncStatus,
  lastSyncTime,
  onSyncNow,
  isSyncing,
  syncIntervalMs,
  onChangeSyncInterval,
  requisitionsCount,
  onOpenRequisitions,
  isAuthenticated,
  userEmail,
  onLogin,
  onLogout,
}) => {
  const formatTime = (d: Date | null) => {
    if (!d) return 'Inicializando...';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs">
      {/* Top Industrial Identification & Real-Time Sync Status Strip */}
      <div className="bg-slate-900 text-slate-300 px-4 sm:px-8 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        {/* Left: Sync status indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1 -ml-1 text-slate-400 hover:text-white"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {isSyncing ? (
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            ) : syncStatus === 'error' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            )}

            <span className="font-medium text-slate-200 text-[11px] sm:text-xs">
              {isSyncing
                ? 'Sincronizando com Google Sheets...'
                : syncStatus === 'error'
                ? 'Atenção: Modo cache ativo'
                : 'Sincronização em tempo real ativa'}
            </span>

            <span className="text-slate-500 hidden sm:inline">•</span>

            <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Última sync: {formatTime(lastSyncTime)}</span>
            </span>
          </div>
        </div>

        {/* Right: Sync Controls & Auth */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Interval selector */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span>Intervalo:</span>
            <select
              value={syncIntervalMs}
              onChange={(e) => onChangeSyncInterval(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value={15000}>15s (Tempo Real)</option>
              <option value={30000}>30s (Padrão)</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
              <option value={0}>Manual</option>
            </select>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 text-[11px] font-medium transition-colors disabled:opacity-50"
            title="Forçar sincronização com a planilha agora"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {/* Requisition Basket Shortcut */}
          <button
            onClick={onOpenRequisitions}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded text-[11px] font-medium transition-colors"
          >
            <ShoppingCart className="w-3 h-3" />
            <span className="hidden sm:inline">Requisições</span>
            <span className="bg-sky-600 text-white font-mono px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {requisitionsCount}
            </span>
          </button>

          {/* Google Auth Status / Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 max-w-[110px] truncate hidden md:inline" title={userEmail || ''}>
                {userEmail}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 ml-1 p-0.5"
                title="Sair"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded font-semibold text-[11px] transition-colors shadow-2xs"
            >
              {/* Google G icon */}
              <svg className="w-3 h-3" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="hidden sm:inline">Conectar Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Title Section - Matching Image 1 */}
      <div className="px-4 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest text-sky-700 uppercase">
            <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
            <span>MANUTAMAKI // MANUTENÇÃO INDUSTRIAL</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase mt-1">
            LOCALIZAR ITEM TÉCNICO
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Encontre o código oficial, dimensões e localização física no almoxarifado antes de abrir a requisição.
          </p>
        </div>

        {/* Industrial Plant Logo Emblem */}
        <div className="hidden lg:flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-right">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              UNIDADE INDUSTRIAL
            </div>
            <div className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              ALMOXARIFADO MANUTENÇÃO
            </div>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div className="px-2 py-1 font-black tracking-tighter text-xl text-sky-900 flex items-center gap-1 font-sans">
            <span className="text-sky-600">M</span>anutamaki
          </div>
        </div>
      </div>
    </header>
  );
};
