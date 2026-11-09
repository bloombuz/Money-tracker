import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../utils/finance';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  ChevronRight,
  CreditCard,
  Building,
  Sparkles,
  Plus,
} from 'lucide-react';
import { TransactionItem } from '../utils/finance';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

interface HomeViewProps {
  onOpenAdd: (type?: 'expense' | 'income' | 'debt_payment') => void;
  onNavigateToDebt: () => void;
  onNavigateToActivity: () => void;
  onNavigateToPlan: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenAdd,
  onNavigateToDebt,
  onNavigateToActivity,
  onNavigateToPlan,
}) => {
  const {
    debtStatus,
    currentMonthTotals,
    transactions,
    debts,
    settings,
    confirmOpeningDebt,
  } = useFinance();

  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  // Next upcoming payment among debts
  const nextPayment = (() => {
    const activeWithDue = debts.filter(
      (d) => (d.monthlyEMI || d.totalStatementDue || d.minimumDue) && d.nextDueDate
    );
    if (activeWithDue.length === 0) return null;
    activeWithDue.sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));
    const first = activeWithDue[0];
    const amount =
      first.type === 'loan'
        ? first.monthlyEMI || 0
        : first.totalStatementDue ?? first.minimumDue ?? 0;
    return {
      name: first.name,
      amount,
      date: first.nextDueDate,
      type: first.type,
    };
  })();

  const recentTransactions = transactions.slice(-5).reverse();

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Opening Debt Confirmation Alert if not confirmed yet */}
      {!settings.openingDebtConfirmed && (
        <div className="bg-[#FEF8D6] border border-[#F6E59A] rounded-[28px] p-4 shadow-sm animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold uppercase tracking-wide mb-1">
                Setup Baseline
              </span>
              <h3 className="text-sm font-bold text-amber-950">
                Confirm your opening debt of ₹3,48,775
              </h3>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                Break this down into your credit cards and personal loans as you find statements.
              </p>
            </div>
            <button
              onClick={confirmOpeningDebt}
              className="px-3.5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-transform"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Main Pastel Sky-Blue Card: Total Debt */}
      <div
        onClick={onNavigateToDebt}
        className="bg-[#DDF0F8] border border-[#C9E7F6] rounded-[32px] p-5 shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      >
        {/* Subtle decorative background gradient circles */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#C5E5F5]/60 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/80 text-sky-950 font-bold text-xs tracking-tight shadow-xs">
              Total debt
            </span>
            {debtStatus.debtToBreakDown > 0 && (
              <span className="text-[11px] font-semibold text-sky-800/80">
                (₹{debtStatus.debtToBreakDown.toLocaleString('en-IN')} to break down)
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-sky-900">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Oversized Black Number */}
        <div className="my-1">
          <div className="text-[34px] sm:text-[38px] font-black text-neutral-950 tracking-tight leading-none">
            {formatINR(debtStatus.totalDebt)}
          </div>
        </div>

        {/* Next payment row directly below */}
        <div className="mt-3 pt-3 border-t border-sky-200/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-sky-900/80 block">
              Next payment due
            </span>
            <div className="text-sm font-bold text-sky-950">
              {nextPayment ? (
                <>
                  {formatINR(nextPayment.amount)} · {nextPayment.name}
                </>
              ) : (
                'No upcoming due dates set'
              )}
            </div>
          </div>
          {nextPayment?.date && (
            <div className="px-2.5 py-1 rounded-full bg-white text-sky-900 text-xs font-semibold shadow-2xs flex items-center gap-1">
              <Calendar className="w-3 h-3 text-sky-600" />
              <span>{nextPayment.date}</span>
            </div>
          )}
        </div>

        {/* Sparkline Visual */}
        <div className="mt-3 h-6 flex items-end gap-1.5 opacity-80">
          {[40, 55, 45, 60, 50, 75, 65, 80, 70, 85, 95, 90].map((val, i) => (
            <div
              key={i}
              style={{ height: `${val}%` }}
              className={`flex-1 rounded-full transition-all ${
                i >= 9 ? 'bg-sky-600' : 'bg-sky-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Grid of Mint-Green Card + White Mini Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Mint-Green Card: Cash Left This Month */}
        <div
          onClick={onNavigateToActivity}
          className="col-span-2 bg-[#DCF3E2] border border-[#C5EBD0] rounded-[28px] p-4.5 shadow-sm cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between"
        >
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/80 text-emerald-950 font-bold text-[11px] tracking-tight mb-1 shadow-2xs">
              Cash left this month
            </span>
            <div className="text-2xl font-black text-neutral-950 tracking-tight">
              {formatINR(currentMonthTotals.cashLeft)}
            </div>
            <p className="text-[11px] text-emerald-900/80 mt-0.5 font-medium">
              After ₹{currentMonthTotals.totalCashOutflow.toLocaleString('en-IN')} paid
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-emerald-800 shadow-xs">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* This Month's Income Card */}
        <div
          onClick={onNavigateToActivity}
          className="bg-white rounded-[26px] p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-neutral-500">Money in</span>
          </div>
          <div className="text-lg font-black text-neutral-900 tracking-tight">
            {formatINR(currentMonthTotals.monthIncome)}
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">This month</span>
        </div>

        {/* This Month's Spending Card */}
        <div
          onClick={onNavigateToActivity}
          className="bg-white rounded-[26px] p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
            <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-neutral-500">Money out</span>
          </div>
          <div className="text-lg font-black text-neutral-900 tracking-tight">
            {formatINR(currentMonthTotals.everydaySpend)}
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">Everyday spend</span>
        </div>
      </div>

      {/* Butter Yellow Feature Card: Plan & Move-Out Spotlight */}
      <div
        onClick={onNavigateToPlan}
        className="bg-[#FEF7D9] border border-[#F6ECB8] rounded-[28px] p-4.5 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-amber-950 font-bold text-[11px] shadow-2xs">
            Plan Snapshot
          </span>
          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
            View details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-medium text-amber-900/80 block">
              Bangalore Move-Out & Goal Room
            </span>
            <div className="text-xl font-black text-neutral-900 tracking-tight mt-0.5">
              Target Income: {formatINR(settings.manualTakeHomeIncome)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-amber-800 uppercase block">
              Invest Room
            </span>
            <span className="text-sm font-bold text-neutral-900">
              {settings.investmentTargetPercent}% ({formatINR(Math.round(settings.manualTakeHomeIncome * (settings.investmentTargetPercent / 100)))})
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-[30px] p-4 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-neutral-900">Recent Activity</h2>
          <button
            onClick={onNavigateToActivity}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            See all
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 px-2">
            <p className="text-xs text-neutral-400 mb-2">No transactions logged yet</p>
            <button
              onClick={() => onOpenAdd('expense')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log first spend</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 px-1 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600'
                        : tx.type === 'debt_payment'
                        ? 'bg-sky-50 text-sky-600'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : tx.type === 'debt_payment' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 truncate max-w-[170px]">
                      {tx.merchant || tx.source || tx.category}
                    </h3>
                    <p className="text-[10px] text-neutral-400 capitalize">
                      {tx.transactionDate} · {tx.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-black tracking-tight ${
                      tx.type === 'income'
                        ? 'text-emerald-600'
                        : tx.type === 'debt_payment'
                        ? 'text-sky-700'
                        : 'text-neutral-900'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatINR(tx.amount)}
                  </div>
                  <span className="text-[10px] text-neutral-400 capitalize">{tx.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
