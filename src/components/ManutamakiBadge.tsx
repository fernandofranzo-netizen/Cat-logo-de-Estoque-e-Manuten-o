import React from 'react';

interface ManutamakiBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ManutamakiBadge: React.FC<ManutamakiBadgeProps> = ({
  className = '',
  size = 'md',
}) => {
  // Scale styles based on size
  const sizeStyles = {
    sm: {
      container: 'px-3 py-1.5 rounded-lg gap-2.5',
      logoText: 'text-lg',
      divider: 'h-7',
      subText: 'text-[8.5px] tracking-[0.14em]',
      titleText: 'text-[10.5px]',
    },
    md: {
      container: 'px-4 py-2.5 rounded-xl gap-3.5',
      logoText: 'text-2xl',
      divider: 'h-9',
      subText: 'text-[10px] tracking-[0.16em]',
      titleText: 'text-xs',
    },
    lg: {
      container: 'px-5 py-3 rounded-2xl gap-4',
      logoText: 'text-3xl',
      divider: 'h-11',
      subText: 'text-[11px] tracking-[0.18em]',
      titleText: 'text-sm',
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center bg-white border border-slate-200/90 shadow-2xs select-none ${sizeStyles.container} ${className}`}
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Left: Brand "Manutamaki" */}
      <div className={`font-black font-sans tracking-tight leading-none ${sizeStyles.logoText}`}>
        <span style={{ color: '#003399' }}>Manuta</span>
        <span style={{ color: '#1d72dd' }}>maki</span>
      </div>

      {/* Middle: Subtle Vertical Divider */}
      <div className={`w-[1.5px] bg-slate-200 ${sizeStyles.divider}`} />

      {/* Right: Technical Unit Information (Right-aligned exactly like reference) */}
      <div className="flex flex-col items-end text-right leading-tight">
        <span
          className={`font-semibold uppercase ${sizeStyles.subText}`}
          style={{ color: '#64748b' }}
        >
          UNIDADE INDUSTRIAL
        </span>
        <span
          className={`font-extrabold uppercase tracking-wide mt-0.5 ${sizeStyles.titleText}`}
          style={{ color: '#003399' }}
        >
          ALMOXARIFADO
        </span>
        <span
          className={`font-extrabold uppercase tracking-wide ${sizeStyles.titleText}`}
          style={{ color: '#003399' }}
        >
          MANUTENÇÃO
        </span>
      </div>
    </div>
  );
};
