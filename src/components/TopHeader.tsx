import React from 'react';
import { Menu } from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs">
      {/* Main Title Section */}
      <div className="px-4 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 -ml-1 mt-0.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

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
        </div>

        {/* Industrial Plant Logo Emblem */}
        <div className="hidden lg:flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
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
