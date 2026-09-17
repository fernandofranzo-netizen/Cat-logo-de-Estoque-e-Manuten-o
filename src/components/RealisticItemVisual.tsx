import React, { useState } from 'react';
import { TechnicalSchematic } from './TechnicalSchematic';
import { useDriveItemImage } from '../services/driveImages';

interface RealisticItemVisualProps {
  codigo: string;
  descricao: string;
  subCategoria: string;
  className?: string;
}

export const RealisticItemVisual: React.FC<RealisticItemVisualProps> = ({
  codigo,
  descricao,
  subCategoria,
  className = '',
}) => {
  const { imageUrl, hasDriveImage } = useDriveItemImage(codigo);
  const [imgError, setImgError] = useState(false);

  // If a dynamic image was found on Google Drive and loaded cleanly, render it
  if (hasDriveImage && imageUrl && !imgError) {
    return (
      <div className={`w-full h-full min-w-full min-h-full flex items-center justify-center p-2 relative overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt={`${codigo} - ${descricao}`}
          width={400}
          height={300}
          referrerPolicy="no-referrer"
          className="w-full h-full max-w-full max-h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105 block"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '120px',
            objectFit: 'contain',
            display: 'block',
          }}
          onError={() => setImgError(true)}
          loading="eager"
        />
      </div>
    );
  }

  const descUpper = (descricao + ' ' + subCategoria + ' ' + codigo).toUpperCase();

  const isRing =
    descUpper.includes('ANEL') ||
    descUpper.includes('ANEIS') ||
    descUpper.includes('SEEGER') ||
    descUpper.includes('TRAVA');
  const isDisc =
    descUpper.includes('DISCO') ||
    descUpper.includes('TELA') ||
    descUpper.includes('CORTE') ||
    descUpper.includes('LÂMINA');
  const isBearing =
    descUpper.includes('ROLAMENTO') ||
    descUpper.includes('ESFERA') ||
    descUpper.includes('MANCAL');

  if (isRing) {
    // Photorealistic black oxide retaining ring exactly matching the user's uploaded image
    return (
      <svg
        viewBox="0 0 320 320"
        className={`w-full h-full max-w-[260px] max-h-[260px] ${className}`}
      >
        <defs>
          {/* Radial light & material gradient for matte black oxide steel */}
          <radialGradient id="ringBlackOxide" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="90%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Cast soft studio shadow */}
          <filter id="studioDropShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
            <feOffset dx="2" dy="10" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft floor shadow */}
        <ellipse
          cx="160"
          cy="255"
          rx="82"
          ry="14"
          fill="#0f172a"
          opacity="0.16"
          style={{ filter: 'blur(8px)' }}
        />

        {/* Main snap ring body with drop shadow */}
        <g filter="url(#studioDropShadow)">
          {/* Outer circle diameter with gap at top */}
          <path
            d="
              M 142 82
              A 82 82 0 1 0 178 82
              L 173 103
              A 62 62 0 1 1 147 103
              Z
            "
            fill="url(#ringBlackOxide)"
            stroke="#0b0f19"
            strokeWidth="1.5"
          />

          {/* Left Lug Ear */}
          <path
            d="
              M 147 103
              L 138 72
              A 13 13 0 0 1 161 68
              L 151 101
              Z
            "
            fill="url(#ringBlackOxide)"
            stroke="#0b0f19"
            strokeWidth="1.2"
          />

          {/* Right Lug Ear */}
          <path
            d="
              M 173 103
              L 182 72
              A 13 13 0 0 0 159 68
              L 169 101
              Z
            "
            fill="url(#ringBlackOxide)"
            stroke="#0b0f19"
            strokeWidth="1.2"
          />

          {/* Left Lug Hole */}
          <circle
            cx="149"
            cy="77"
            r="5.5"
            fill="#fafafa"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Hole inner rim depth */}
          <circle
            cx="149.5"
            cy="77.5"
            r="4"
            fill="#e2e8f0"
            stroke="#334155"
            strokeWidth="0.6"
          />

          {/* Right Lug Hole */}
          <circle
            cx="171"
            cy="77"
            r="5.5"
            fill="#fafafa"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Hole inner rim depth */}
          <circle
            cx="170.5"
            cy="77.5"
            r="4"
            fill="#e2e8f0"
            stroke="#334155"
            strokeWidth="0.6"
          />
        </g>

        {/* Subtle highlight rim simulating studio light from top */}
        <path
          d="
            M 142 82
            A 82 82 0 0 0 92 135
          "
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>
    );
  }

  if (isDisc) {
    // Photorealistic industrial cutting disc / mesh disc
    return (
      <svg
        viewBox="0 0 320 320"
        className={`w-full h-full max-w-[260px] max-h-[260px] ${className}`}
      >
        <defs>
          <radialGradient id="discMetal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="95%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="centerRing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
        </defs>
        <ellipse
          cx="160"
          cy="265"
          rx="95"
          ry="15"
          fill="#0f172a"
          opacity="0.18"
          style={{ filter: 'blur(8px)' }}
        />
        <circle
          cx="160"
          cy="160"
          r="105"
          fill="url(#discMetal)"
          stroke="#0f172a"
          strokeWidth="2"
        />
        <circle
          cx="160"
          cy="160"
          r="88"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle
          cx="160"
          cy="160"
          r="72"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle
          cx="160"
          cy="160"
          r="44"
          fill="url(#centerRing)"
          stroke="#334155"
          strokeWidth="2"
        />
        <circle
          cx="160"
          cy="160"
          r="20"
          fill="#fafafa"
          stroke="#0f172a"
          strokeWidth="3"
        />
      </svg>
    );
  }

  if (isBearing) {
    // Photorealistic deep groove ball bearing
    return (
      <svg
        viewBox="0 0 320 320"
        className={`w-full h-full max-w-[260px] max-h-[260px] ${className}`}
      >
        <defs>
          <radialGradient id="bearingOuter" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="85%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="ballShine" cx="35%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="80%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>
        </defs>
        <ellipse
          cx="160"
          cy="265"
          rx="95"
          ry="15"
          fill="#0f172a"
          opacity="0.18"
          style={{ filter: 'blur(8px)' }}
        />
        <circle
          cx="160"
          cy="160"
          r="105"
          fill="url(#bearingOuter)"
          stroke="#0f172a"
          strokeWidth="3"
        />
        <circle
          cx="160"
          cy="160"
          r="82"
          fill="#334155"
          stroke="#1e293b"
          strokeWidth="2"
        />
        <circle cx="160" cy="160" r="68" fill="#1e293b" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 160 + 68 * Math.cos(rad);
          const cy = 160 + 68 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="13"
              fill="url(#ballShine)"
              stroke="#0f172a"
              strokeWidth="1"
            />
          );
        })}
        <circle
          cx="160"
          cy="160"
          r="50"
          fill="url(#bearingOuter)"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        <circle
          cx="160"
          cy="160"
          r="30"
          fill="#fafafa"
          stroke="#0f172a"
          strokeWidth="3"
        />
      </svg>
    );
  }

  // Generic clean mechanical component schematic
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <TechnicalSchematic
        codigo={codigo}
        subCategoria={subCategoria}
        categoria="MATERIAL"
        descricao={descricao}
        className="w-48 h-48"
        showCadLabel={false}
      />
    </div>
  );
};
