import React from 'react';
import { Menu } from 'lucide-react';
import { ManutamakiBadge } from './ManutamakiBadge';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs">
      {/* Main Title Section */}
      <div className="px-4 sm:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Catálogo de Estoque e Manutenção
            </h1>
          </div>
        </div>

        {/* Industrial Plant Official Badge (Single responsive element) */}
        <div className="flex items-center self-start md:self-center shrink-0">
          <ManutamakiBadge />
        </div>
      </div>
    </header>
  );
};
