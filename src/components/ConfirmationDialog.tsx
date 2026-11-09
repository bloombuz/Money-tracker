import React from 'react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmDeleteProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-neutral-100 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 id="confirm-delete-title" className="text-base font-bold text-neutral-900 mb-1">
          {title}
        </h3>
        <p id="confirm-delete-desc" className="text-xs text-neutral-500 mb-5 leading-relaxed">
          {message}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="py-2.5 px-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface OpeningDebtModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const OpeningDebtModal: React.FC<OpeningDebtModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-debt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-150">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F3FA] text-sky-700 mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="text-center mb-5">
          <span className="inline-block px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2">
            First Setup · Bangalore
          </span>
          <h2 id="opening-debt-title" className="text-xl font-extrabold text-neutral-900 tracking-tight">
            Confirm Opening Debt
          </h2>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            Let's start your debt-free journey. Confirm your initial baseline debt to get started.
          </p>
          <div className="mt-4 p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 text-center">
            <span className="text-xs font-semibold text-neutral-400 block mb-0.5">
              Opening Debt Amount
            </span>
            <span className="text-3xl font-black text-neutral-900 tracking-tight">
              ₹3,48,775
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-3 text-left">
            You can assign portions of this ₹3,48,775 to your credit cards and loans as you find their statements. Any unassigned balance remains as <strong>Debt to break down</strong>.
          </p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-3.5 bg-neutral-900 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform"
        >
          Confirm ₹3,48,775 & Begin
        </button>
      </div>
    </div>
  );
};
