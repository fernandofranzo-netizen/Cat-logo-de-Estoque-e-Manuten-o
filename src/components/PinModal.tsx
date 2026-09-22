import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin === 'admin') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center mx-auto shadow-md">
            <img src="/logo-transparent.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Acesso de Administrador
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Digite a senha de 4 dígitos para acessar o Console de Gestão e Administração.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="••••"
                className={`w-40 mx-auto text-center text-2xl tracking-[0.4em] font-mono font-black py-2.5 px-4 bg-slate-50 border rounded-xl focus:outline-none transition-all ${
                  error
                    ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-600 bg-rose-50/40'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900'
                }`}
              />
              {error && (
                <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Senha incorreta. Padrão: 1234
                </p>
              )}
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200/60 inline-block">
              Senha padrão: <strong className="text-slate-700">1234</strong>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPin('');
                  setError(false);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
