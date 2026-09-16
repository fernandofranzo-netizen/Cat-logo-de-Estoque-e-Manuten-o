import React from 'react';

interface TechnicalSchematicProps {
  codigo: string;
  subCategoria: string;
  categoria: string;
  descricao: string;
  className?: string;
  showCadLabel?: boolean;
}

export const TechnicalSchematic: React.FC<TechnicalSchematicProps> = ({
  codigo,
  subCategoria,
  descricao,
  className = '',
  showCadLabel = true,
}) => {
  const descUpper = (descricao + ' ' + subCategoria).toUpperCase();

  // Determine schematic type based on item characteristics
  const isRing = descUpper.includes('ANEL') || descUpper.includes('ANEIS') || descUpper.includes('SEEGER');
  const isTape = descUpper.includes('FITA') || descUpper.includes('FITAS') || descUpper.includes('ADESIVA');
  const isDisc = descUpper.includes('DISCO') || descUpper.includes('TELA') || descUpper.includes('CORTE');
  const isBearing = descUpper.includes('ROLAMENTO') || descUpper.includes('ESFERA') || descUpper.includes('MANCAL');
  const isScrew = descUpper.includes('PARAFUSO') || descUpper.includes('PORCA') || descUpper.includes('ARRUELA');
  const isElectrical = descUpper.includes('ELETR') || descUpper.includes('CABO') || descUpper.includes('FUSIVEL') || descUpper.includes('DISJUNTOR');
  const isValve = descUpper.includes('VALVULA') || descUpper.includes('CONEX') || descUpper.includes('ENGATE');

  return (
    <div
      className={`relative flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-lg overflow-hidden select-none ${className}`}
    >
      {/* Background blueprint grid watermark */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #f8fafc 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {showCadLabel && (
        <div className="absolute top-2 left-2.5 flex items-center gap-1.5 z-10">
          <span className="text-[9px] font-mono tracking-wider text-slate-500 font-semibold uppercase bg-white/90 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
            CAD // {isRing ? 'DIN 471/472' : isTape ? 'ISO 29862' : isDisc ? 'DIN EN 12413' : 'REF. TÉCNICA'}
          </span>
        </div>
      )}

      {/* SVG Graphics according to component type */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {isRing ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            {/* Center crosshair */}
            <line x1="80" y1="10" x2="80" y2="150" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="10" y1="80" x2="150" y2="80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            
            {/* Seeger Ring Path */}
            <path
              d="M 64 28 A 54 54 0 1 0 96 28 L 94 39 A 43 43 0 1 1 66 39 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* Left ear */}
            <circle cx="59" cy="28" r="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            <circle cx="59" cy="28" r="3.2" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
            {/* Right ear */}
            <circle cx="101" cy="28" r="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            <circle cx="101" cy="28" r="3.2" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
            
            {/* Caliper / dimension indicators */}
            <path d="M 32 80 L 22 80 M 22 75 L 22 85" stroke="#64748b" strokeWidth="1.2" />
            <path d="M 128 80 L 138 80 M 138 75 L 138 85" stroke="#64748b" strokeWidth="1.2" />
            <text x="80" y="142" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              ANEL RETENÇÃO
            </text>
          </svg>
        ) : isTape ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            {/* Roll outer */}
            <circle cx="80" cy="80" r="54" fill="#f1f5f9" stroke="#334155" strokeWidth="4" />
            <circle cx="80" cy="80" r="42" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
            {/* Core core */}
            <circle cx="80" cy="80" r="24" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
            <circle cx="80" cy="80" r="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Peel edge */}
            <path d="M 80 26 C 105 26, 128 42, 134 68 L 146 64" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" />
            <text x="80" y="142" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              ROLO / ADESIVO
            </text>
          </svg>
        ) : isDisc ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            <circle cx="80" cy="80" r="56" fill="#334155" stroke="#0f172a" strokeWidth="3" />
            {/* Mesh pattern */}
            <circle cx="80" cy="80" r="46" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="80" cy="80" r="28" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="80" cy="80" r="12" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
            {/* Radial grooves */}
            <line x1="80" y1="26" x2="80" y2="48" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="80" y1="112" x2="80" y2="134" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="26" y1="80" x2="48" y2="80" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="112" y1="80" x2="134" y2="80" stroke="#cbd5e1" strokeWidth="2" />
            <text x="80" y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              DISCO / LÂMINA
            </text>
          </svg>
        ) : isBearing ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            <circle cx="80" cy="80" r="56" stroke="#0f172a" strokeWidth="4" fill="#f1f5f9" />
            <circle cx="80" cy="80" r="42" stroke="#334155" strokeWidth="2" />
            <circle cx="80" cy="80" r="26" stroke="#0f172a" strokeWidth="3" fill="#e2e8f0" />
            <circle cx="80" cy="80" r="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
            {/* Bearing balls */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 80 + 34 * Math.cos(rad);
              const cy = 80 + 34 * Math.sin(rad);
              return <circle key={angle} cx={cx} cy={cy} r="6" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />;
            })}
            <text x="80" y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              ROLAMENTO ESFERAS
            </text>
          </svg>
        ) : isScrew ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            {/* Hex head */}
            <polygon points="65,30 95,30 110,48 95,66 65,66 50,48" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
            {/* Thread body */}
            <rect x="70" y="66" width="20" height="64" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
            {/* Thread grooves */}
            <line x1="68" y1="76" x2="92" y2="80" stroke="#0f172a" strokeWidth="2" />
            <line x1="68" y1="88" x2="92" y2="92" stroke="#0f172a" strokeWidth="2" />
            <line x1="68" y1="100" x2="92" y2="104" stroke="#0f172a" strokeWidth="2" />
            <line x1="68" y1="112" x2="92" y2="116" stroke="#0f172a" strokeWidth="2" />
            <text x="80" y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              FIXAÇÃO / ROSCA
            </text>
          </svg>
        ) : isElectrical ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            <rect x="45" y="35" width="70" height="90" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
            <circle cx="80" cy="55" r="7" fill="#22c55e" />
            {/* Terminals */}
            <rect x="55" y="24" width="14" height="12" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            <rect x="91" y="24" width="14" height="12" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            <rect x="55" y="124" width="14" height="12" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            <rect x="91" y="124" width="14" height="12" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            {/* Lightning / Switch symbol */}
            <path d="M 83 72 L 72 88 L 81 88 L 77 104 L 92 86 L 82 86 Z" fill="#eab308" />
            <text x="80" y="148" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              COMPONENTE ELÉTRICO
            </text>
          </svg>
        ) : isValve ? (
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            {/* Valve body */}
            <polygon points="40,55 80,75 80,85 40,105" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="120,55 80,75 80,85 120,105" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
            {/* Stem & wheel */}
            <rect x="76" y="40" width="8" height="36" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
            <rect x="60" y="32" width="40" height="10" rx="3" fill="#0284c7" stroke="#0f172a" strokeWidth="2" />
            <text x="80" y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              VÁLVULA / CONEXÃO
            </text>
          </svg>
        ) : (
          /* General mechanical / warehouse component */
          <svg viewBox="0 0 160 160" className="w-28 h-28 text-slate-800 transition-transform duration-300 group-hover:scale-105" fill="none">
            {/* Isometric technical cube */}
            <polygon points="80,35 125,60 80,85 35,60" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="35,60 80,85 80,130 35,105" fill="#64748b" stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="80,85 125,60 125,105 80,130" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
            {/* Inner lines */}
            <line x1="80" y1="85" x2="80" y2="130" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="80" cy="60" r="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
            <text x="80" y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="600">
              ITEM TÉCNICO // {codigo.split('-')[1] || 'ESTOQUE'}
            </text>
          </svg>
        )}
      </div>

      {/* Bottom badge */}
      <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono text-slate-400">
        <span>VISTA DE REFERÊNCIA</span>
        <span className="font-semibold text-slate-500">{codigo.slice(-5)}</span>
      </div>
    </div>
  );
};
