import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DebtItem, formatINR } from '../utils/finance';
import { X, Trash2, Check, AlertCircle } from 'lucide-react';
import { ConfirmDeleteDialog } from './ConfirmationDialog';

interface DebtDetailModalProps {
  debt: DebtItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DebtDetailModal: React.FC<DebtDetailModalProps> = ({
  debt,
  isOpen,
  onClose,
}) => {
  const { addOrUpdateDebt, deleteDebt, debtStatus } = useFinance();

  const isNew = !debt;
  const [type, setType] = useState<'loan' | 'credit_card'>(debt?.type || 'loan');
  const [name, setName] = useState(debt?.name || '');
  const [balance, setBalance] = useState(debt ? String(debt.balance) : '');
  const [assignedFromOpening, setAssignedFromOpening] = useState(
    debt ? String(debt.assignedFromOpening || 0) : '0'
  );
  const [isNewBorrowing, setIsNewBorrowing] = useState(debt?.isNewBorrowing || false);
  const [monthlyEMI, setMonthlyEMI] = useState(debt?.monthlyEMI ? String(debt.monthlyEMI) : '');
  const [interestRate, setInterestRate] = useState(
    debt?.interestRate !== undefined ? String(debt.interestRate) : ''
  );
  const [dueDate, setDueDate] = useState(debt?.dueDate || '');
  const [nextDueDate, setNextDueDate] = useState(debt?.nextDueDate || '');
  const [totalStatementDue, setTotalStatementDue] = useState(
    debt?.totalStatementDue !== undefined ? String(debt.totalStatementDue) : ''
  );
  const [minimumDue, setMinimumDue] = useState(
    debt?.minimumDue !== undefined ? String(debt.minimumDue) : ''
  );
  const [statementMissing, setStatementMissing] = useState(debt?.statementMissing || false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const balNum = parseFloat(balance);
    if (isNaN(balNum) || balNum < 0) return;

    const assignedNum = isNewBorrowing ? 0 : parseFloat(assignedFromOpening) || balNum;

    const debtId = debt ? debt.id : 'debt_' + Date.now();
    const item: DebtItem = {
      id: debtId,
      type,
      name: name.trim() || (type === 'loan' ? 'Personal Loan' : 'Credit Card'),
      balance: balNum,
      assignedFromOpening: assignedNum,
      isNewBorrowing,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      monthlyEMI: type === 'loan' && monthlyEMI ? parseFloat(monthlyEMI) : undefined,
      dueDate: dueDate || undefined,
      nextDueDate: nextDueDate || undefined,
      totalStatementDue:
        type === 'credit_card' && totalStatementDue ? parseFloat(totalStatementDue) : undefined,
      minimumDue: type === 'credit_card' && minimumDue ? parseFloat(minimumDue) : undefined,
      statementMissing: type === 'credit_card' ? statementMissing : undefined,
    };

    await addOrUpdateDebt(item);
    onClose();
  };

  const handleDelete = async () => {
    if (debt) {
      await deleteDebt(debt.id);
    }
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-modal-title"
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in"
      >
        <div
          className="w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="debt-modal-title" className="text-lg font-bold text-neutral-900 tracking-tight">
              {isNew ? 'Add Loan or Credit Card' : `Edit ${debt.name}`}
            </h2>
            <div className="flex items-center gap-1">
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  aria-label="Delete debt"
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('loan')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === 'loan' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                }`}
              >
                Loan / EMI
              </button>
              <button
                type="button"
                onClick={() => setType('credit_card')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === 'credit_card'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500'
                }`}
              >
                Credit Card
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">
                {type === 'loan' ? 'Lender / Loan Name' : 'Card Nickname'}
              </label>
              <input
                type="text"
                data-testid="debt-name-input"
                placeholder={type === 'loan' ? 'HDFC Personal Loan' : 'ICICI Amazon Pay'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium"
              />
            </div>

            {/* Current Balance */}
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">
                {type === 'loan' ? 'Outstanding Principal (₹)' : 'Current Balance (₹)'}
              </label>
              <input
                type="number"
                data-testid="debt-balance-input"
                step="any"
                placeholder="100000"
                value={balance}
                onChange={(e) => {
                  setBalance(e.target.value);
                  if (isNew && !isNewBorrowing && (!assignedFromOpening || assignedFromOpening === '0')) {
                    setAssignedFromOpening(e.target.value);
                  }
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-base font-bold"
              />
            </div>

            {/* Opening debt allocation vs New Borrowing */}
            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800 block">
                    Part of Opening Debt (₹3,48,775)?
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Remaining unassigned: {formatINR(debtStatus.debtToBreakDown)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewBorrowing(!isNewBorrowing)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                    !isNewBorrowing
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {!isNewBorrowing ? 'Part of opening' : 'New borrowing'}
                </button>
              </div>

              {!isNewBorrowing && (
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                    Amount carved out from opening debt (₹)
                  </label>
                  <input
                    type="number"
                    data-testid="debt-assigned-input"
                    step="any"
                    value={assignedFromOpening}
                    onChange={(e) => setAssignedFromOpening(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Assigning moves it out of "Debt to break down" so your total stays correct.
                  </p>
                </div>
              )}
            </div>

            {/* Loan Specific fields */}
            {type === 'loan' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                    Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="3500"
                    value={monthlyEMI}
                    onChange={(e) => setMonthlyEMI(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                    Interest Rate (% if known)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="11.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Credit Card Specific fields */}
            {type === 'credit_card' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Total Statement Due (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Leave blank if unknown"
                      value={totalStatementDue}
                      onChange={(e) => setTotalStatementDue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Minimum Due (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Leave blank if unknown"
                      value={minimumDue}
                      onChange={(e) => setMinimumDue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl border border-amber-200/60 cursor-pointer text-[11px] font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={statementMissing}
                        onChange={(e) => setStatementMissing(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>Statement missing</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-neutral-900 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5 mt-2"
            >
              <Check className="w-4 h-4" />
              <span>{isNew ? 'Add Debt' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={showConfirmDelete}
        title={`Delete ${debt?.name}?`}
        message="This loan or credit card will be removed. Its balance will no longer count towards your total debt."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};
