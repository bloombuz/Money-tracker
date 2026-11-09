import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, DebtItem } from '../utils/finance';
import {
  ShieldAlert,
  CreditCard,
  Building,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { DebtDetailModal } from '../components/DebtDetailModal';

interface DebtViewProps {
  onOpenAdd: (type?: 'expense' | 'income' | 'debt_payment') => void;
}

export const DebtView: React.FC<DebtViewProps> = ({ onOpenAdd }) => {
  const { debts, debtStatus, transactions, selectedMonth } = useFinance();

  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [isAddingDebt, setIsAddingDebt] = useState(false);

  // Loans vs Cards
  const loans = debts.filter((d) => d.type === 'loan');
  const cards = debts.filter((d) => d.type === 'credit_card');

  // Month-by-month schedule calculation for the current month
  // Due: sum of loan EMIs + card statement dues (or minimum dues)
  // Paid: actual debt payments made this month
  // Still to pay: max(0, Due - Paid)
  const currentMonthPaid = transactions
    .filter((t) => t.type === 'debt_payment' && t.transactionDate.startsWith(selectedMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthDue = debtStatus.totalMonthlyDue;
  const stillToPay = Math.max(0, currentMonthDue - currentMonthPaid);

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Top Banner: Total Debt & Debt to Break Down */}
      <div className="bg-[#DDF0F8] border border-[#CBE5F6] rounded-[32px] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-sky-950 shadow-2xs">
            Debt Overview
          </span>
          <span className="text-[11px] font-bold text-sky-800">
            Opening Baseline: ₹{debtStatus.openingDebt.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="my-1">
          <span className="text-xs font-semibold text-sky-900/80 block">Current Total Debt</span>
          <div className="text-[36px] font-black text-neutral-950 tracking-tight leading-none mt-1">
            {formatINR(debtStatus.totalDebt)}
          </div>
        </div>

        {/* Remainder: Debt to break down */}
        <div className="mt-4 pt-3 border-t border-sky-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-sky-900/80 block">
              Debt to break down (unassigned remainder)
            </span>
            <span className="text-base font-extrabold text-sky-950">
              {formatINR(debtStatus.debtToBreakDown)}
            </span>
          </div>

          <button
            onClick={() => setIsAddingDebt(true)}
            className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign balance</span>
          </button>
        </div>

        {debtStatus.debtToBreakDown > 0 && (
          <p className="text-[10px] text-sky-800/80 mt-2 bg-white/60 p-2 rounded-xl">
            💡 As you locate statements for your loans and credit cards, add them below. Carving out balances automatically reduces this remainder so your total debt remains exact.
          </p>
        )}
      </div>

      {/* Month-by-month Schedule (Due, Paid, Still to pay) */}
      <div className="bg-[#FDF0E6] border border-[#F8DCBF] rounded-[28px] p-4.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 bg-white/80 text-orange-950 rounded-full text-[11px] font-bold">
              Month Schedule · {selectedMonth}
            </span>
          </div>
          <button
            onClick={() => onOpenAdd('debt_payment')}
            className="text-[11px] font-bold text-orange-900 hover:underline"
          >
            + Pay debt
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-white/80 rounded-2xl p-2.5 shadow-2xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Due</span>
            <span className="text-sm font-black text-neutral-900">
              {formatINR(currentMonthDue)}
            </span>
          </div>

          <div className="bg-white/80 rounded-2xl p-2.5 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Paid</span>
            <span className="text-sm font-black text-emerald-700">
              {formatINR(currentMonthPaid)}
            </span>
          </div>

          <div className="bg-white/80 rounded-2xl p-2.5 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase block">Still to pay</span>
            <span className="text-sm font-black text-rose-700">
              {formatINR(stillToPay)}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-orange-950/70 mt-2.5 text-center">
          Projections are estimates based on active EMIs & statements. Missing card statements are flagged below.
        </p>
      </div>

      {/* Loans Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-sky-700" />
            <span>Loans & EMIs ({loans.length})</span>
          </h2>
          <button
            onClick={() => setIsAddingDebt(true)}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            + Add loan
          </button>
        </div>

        {loans.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center border border-neutral-150 text-xs text-neutral-400">
            No loans added yet. Assign a portion of your starting debt or add a loan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {loans.map((loan) => (
              <div
                key={loan.id}
                onClick={() => setEditingDebt(loan)}
                className="bg-white rounded-[24px] p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-neutral-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-neutral-900">{loan.name}</h3>
                      {loan.isNewBorrowing ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[9px] font-bold">
                          New Borrowing
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-900 rounded-full text-[9px] font-bold">
                          Assigned ₹{loan.assignedFromOpening.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      {loan.interestRate ? `${loan.interestRate}% APR` : 'Interest rate unknown'} · EMI: {loan.monthlyEMI ? formatINR(loan.monthlyEMI) : 'Not set'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-neutral-400 block">Balance</span>
                    <span className="text-base font-black text-neutral-900">
                      {formatINR(loan.balance)}
                    </span>
                  </div>
                </div>

                {loan.nextDueDate && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      Next due: {loan.nextDueDate}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdd('debt_payment');
                      }}
                      className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg font-bold text-[11px] hover:bg-sky-100"
                    >
                      Record EMI
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credit Cards Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-purple-700" />
            <span>Credit Cards ({cards.length})</span>
          </h2>
          <button
            onClick={() => setIsAddingDebt(true)}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            + Add card
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center border border-neutral-150 text-xs text-neutral-400">
            No credit cards added. Link your credit cards to track balances and bill payments.
          </div>
        ) : (
          <div className="space-y-2.5">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => setEditingDebt(card)}
                className="bg-white rounded-[24px] p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-neutral-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-neutral-900">{card.name}</h3>
                      {card.statementMissing && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Statement Missing
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Statement Due: {card.totalStatementDue !== undefined ? formatINR(card.totalStatementDue) : 'Unknown'}
                      {card.minimumDue !== undefined ? ` · Min: ${formatINR(card.minimumDue)}` : ''}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-neutral-400 block">Current Balance</span>
                    <span className="text-base font-black text-neutral-900">
                      {formatINR(card.balance)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    Due: {card.nextDueDate || 'No statement date'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAdd('debt_payment');
                    }}
                    className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-bold text-[11px] hover:bg-purple-100"
                  >
                    Pay bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DebtDetailModal
        debt={editingDebt}
        isOpen={Boolean(editingDebt) || isAddingDebt}
        onClose={() => {
          setEditingDebt(null);
          setIsAddingDebt(false);
        }}
      />
    </div>
  );
};
