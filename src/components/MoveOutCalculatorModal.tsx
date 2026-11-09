import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, MoveOutInputs } from '../utils/finance';
import { X, Home, MapPin, Calculator, AlertTriangle, Check, ArrowRight } from 'lucide-react';

interface MoveOutCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoveOutCalculatorModal: React.FC<MoveOutCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { moveOutCalc, updateMoveOutCalc, moveOutSummary, effectiveTakeHomeIncome } = useFinance();

  const [form, setForm] = useState<MoveOutInputs>(moveOutCalc);

  if (!isOpen) return null;

  const handleChange = (field: keyof MoveOutInputs, value: string) => {
    const num = parseFloat(value) || 0;
    setForm((prev) => ({ ...prev, [field]: num }));
  };

  const handleSave = async () => {
    await updateMoveOutCalc(form);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="moveout-calc-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] p-5 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 id="moveout-calc-title" className="text-base font-bold text-neutral-900 tracking-tight">
                Bangalore Move-Out Calculator
              </h2>
              <span className="text-[11px] text-neutral-400">
                Koramangala, Indiranagar, HSR, Whitefield
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Core Results Cards (Matching prompt requirements) */}
        <div className="space-y-2.5 mb-5">
          {/* Result 1: Cash needed before moving */}
          <div className="bg-[#EBF4FA] border border-[#CCE5F7] rounded-[24px] p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wide block mb-0.5">
              1. Cash Needed Before Moving
            </span>
            <div className="text-2xl font-black text-neutral-950 tracking-tight">
              {formatINR(moveOutSummary.cashNeededBeforeMoving)}
            </div>
            <p className="text-[11px] text-sky-900/80 mt-1 leading-snug">
              Deposit ({formatINR(form.refundableDeposit)}) + 1st month rent ({formatINR(form.monthlyRent)}) + Brokerage ({formatINR(form.brokerage)}) + Moving ({formatINR(form.movingCosts)}) + Setup ({formatINR(form.setupCosts)})
              {form.overlapRent > 0 ? ` + Overlap (${formatINR(form.overlapRent)})` : ''}.
            </p>
          </div>

          {/* Result 2: Monthly housing cost after moving */}
          <div className="bg-[#EBF7EE] border border-[#D0EED7] rounded-[24px] p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block mb-0.5">
              2. Monthly Housing Cost After Moving
            </span>
            <div className="text-2xl font-black text-neutral-950 tracking-tight">
              {formatINR(moveOutSummary.monthlyHousingCostAfterMoving)}
              <span className="text-xs font-semibold text-neutral-400 font-normal"> / month</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-950/80">
              <span>Rent {formatINR(form.monthlyRent)} + Maint {formatINR(form.maintenance)} + Util {formatINR(form.utilities)}</span>
              <span className="font-bold">
                {moveOutSummary.monthlyCostDifference >= 0 ? '+' : ''}
                {formatINR(moveOutSummary.monthlyCostDifference)} vs now
              </span>
            </div>
          </div>

          {/* Result 3: Maximum base rent I can afford */}
          <div className="bg-[#FEF7D9] border border-[#F6ECB8] rounded-[24px] p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide block mb-0.5">
              3. Maximum Base Rent You Can Afford
            </span>
            <div className="text-2xl font-black text-neutral-950 tracking-tight">
              {formatINR(moveOutSummary.maxBaseRentAffordable)}
              <span className="text-xs font-semibold text-neutral-400 font-normal"> / month</span>
            </div>
            <p className="text-[11px] text-amber-950/80 mt-1 leading-snug">
              Based on your ₹{effectiveTakeHomeIncome.toLocaleString('en-IN')} take-home, after non-housing essentials, required debt, maintenance, utilities, and chosen investments.
            </p>

            {moveOutSummary.afterMoveShortfall > 0 && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Shortfall: This quote exceeds your budget by {formatINR(moveOutSummary.afterMoveShortfall)}/mo.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4 text-xs">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            New Place Quote & Moving Costs
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                value={form.monthlyRent || ''}
                onChange={(e) => handleChange('monthlyRent', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Maintenance (₹)
              </label>
              <input
                type="number"
                value={form.maintenance || ''}
                onChange={(e) => handleChange('maintenance', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Utilities (BESCOM, Wi-Fi, Water) (₹)
              </label>
              <input
                type="number"
                value={form.utilities || ''}
                onChange={(e) => handleChange('utilities', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Refundable Deposit (₹)
              </label>
              <input
                type="number"
                value={form.refundableDeposit || ''}
                onChange={(e) => handleChange('refundableDeposit', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-bold"
              />
              <span className="text-[9px] text-neutral-400">Kept separate from monthly costs</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
                Brokerage (₹)
              </label>
              <input
                type="number"
                value={form.brokerage || ''}
                onChange={(e) => handleChange('brokerage', e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
                Packers & Movers (₹)
              </label>
              <input
                type="number"
                value={form.movingCosts || ''}
                onChange={(e) => handleChange('movingCosts', e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
                Setup / Furniture (₹)
              </label>
              <input
                type="number"
                value={form.setupCosts || ''}
                onChange={(e) => handleChange('setupCosts', e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              Overlap Rent with current house (₹)
            </label>
            <input
              type="number"
              value={form.overlapRent || ''}
              onChange={(e) => handleChange('overlapRent', e.target.value)}
              placeholder="e.g. 10000 (if moving mid-month)"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200"
            />
            <span className="text-[10px] text-neutral-400">
              Only counted where you enter overlap
            </span>
          </div>

          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pt-2 border-t border-neutral-100">
            Current Housing Benchmark
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
                Current Rent (₹)
              </label>
              <input
                type="number"
                value={form.currentRent || ''}
                onChange={(e) => handleChange('currentRent', e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
                Current Maint (₹)
              </label>
              <input
                type="number"
                value={form.currentMaintenance || ''}
                onChange={(e) => handleChange('currentMaintenance', e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
                Current Util (₹)
              </label>
              <input
                type="number"
                value={form.currentUtilities || ''}
                onChange={(e) => handleChange('currentUtilities', e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-neutral-900 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Budget & Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
