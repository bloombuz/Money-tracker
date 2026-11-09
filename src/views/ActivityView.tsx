import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, TransactionItem } from '../utils/finance';
import {
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

interface ActivityViewProps {
  onOpenAdd: (type?: 'expense' | 'income' | 'debt_payment') => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ onOpenAdd }) => {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    categories,
    currentMonthTotals,
  } = useFinance();

  const [viewTab, setViewTab] = useState<'all' | 'money_out' | 'money_in' | 'debt_payments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  // Month navigation: previous month & next month
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month, 1);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  // Filtered transactions for the current month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month match (YYYY-MM)
      if (!tx.transactionDate.startsWith(selectedMonth)) return false;

      // Tab match
      if (viewTab === 'money_out' && tx.type !== 'expense') return false;
      if (viewTab === 'money_in' && tx.type !== 'income') return false;
      if (viewTab === 'debt_payments' && tx.type !== 'debt_payment') return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Payment method filter
      if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${tx.merchant || ''} ${tx.source || ''} ${tx.category || ''} ${tx.note || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, viewTab, selectedCategory, selectedPaymentMethod, searchQuery]);

  // Daily grouping
  const groupedByDay = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};

    filteredTransactions.forEach((tx) => {
      const day = tx.transactionDate;
      if (!groups[day]) groups[day] = [];
      groups[day].push(tx);
    });

    // Sort days descending
    return Object.entries(groups).sort(([dayA], [dayB]) => dayB.localeCompare(dayA));
  }, [filteredTransactions]);

  // Formatted month title e.g. "November 2026"
  const formattedMonthTitle = (() => {
    try {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  })();

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Month Picker Row */}
      <div className="bg-white rounded-[26px] p-2.5 px-4 border border-neutral-150 shadow-xs flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          aria-label="Previous month"
          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-black text-neutral-900 tracking-tight">
            {formattedMonthTitle}
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          aria-label="Next month"
          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 active:scale-95 transition-transform"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#EBF7EE] border border-[#D0EED7] rounded-2xl p-2.5 text-center">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Inflow</span>
          <span className="text-sm font-extrabold text-neutral-900">
            {formatINR(currentMonthTotals.monthIncome)}
          </span>
        </div>

        <div className="bg-[#FFF0F2] border border-[#FCD2D8] rounded-2xl p-2.5 text-center">
          <span className="text-[10px] font-bold text-rose-800 uppercase block">Everyday</span>
          <span className="text-sm font-extrabold text-neutral-900">
            {formatINR(currentMonthTotals.everydaySpend)}
          </span>
        </div>

        <div className="bg-[#EBF4FA] border border-[#CCE5F7] rounded-2xl p-2.5 text-center">
          <span className="text-[10px] font-bold text-sky-800 uppercase block">Debt Paid</span>
          <span className="text-sm font-extrabold text-neutral-900">
            {formatINR(currentMonthTotals.debtPayments)}
          </span>
        </div>
      </div>

      {/* Tabs: All / Money Out / Money In / Debt Payments */}
      <div className="flex gap-1.5 p-1 bg-neutral-100 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setViewTab('all')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
            viewTab === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setViewTab('money_out')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
            viewTab === 'money_out'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-neutral-500'
          }`}
        >
          Money Out
        </button>
        <button
          onClick={() => setViewTab('money_in')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
            viewTab === 'money_in'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-neutral-500'
          }`}
        >
          Money In
        </button>
        <button
          onClick={() => setViewTab('debt_payments')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
            viewTab === 'debt_payments'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-neutral-500'
          }`}
        >
          Debt Payments
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search merchant, category, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="flex gap-2 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-medium capitalize"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            aria-label="Filter by payment method"
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-medium uppercase"
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="netbanking">Netbanking</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Daily Grouped List */}
      {groupedByDay.length === 0 ? (
        <div className="bg-white rounded-[28px] p-8 text-center border border-neutral-100 shadow-2xs">
          <p className="text-xs text-neutral-400 mb-3">No activity matching your filters</p>
          <button
            onClick={() => onOpenAdd('expense')}
            className="px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDay.map(([dayStr, dayTxList]) => {
            const dayTotalSpend = dayTxList
              .filter((t) => t.type === 'expense' || t.type === 'debt_payment')
              .reduce((sum, t) => sum + t.amount, 0);

            const dayTotalIncome = dayTxList
              .filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);

            // Format day date
            const formattedDayHeader = (() => {
              try {
                const [y, m, d] = dayStr.split('-');
                const dt = new Date(Number(y), Number(m) - 1, Number(d));
                return dt.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
              } catch {
                return dayStr;
              }
            })();

            return (
              <div
                key={dayStr}
                className="bg-white rounded-[28px] p-4 border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-neutral-100 text-xs">
                  <span className="font-bold text-neutral-900">{formattedDayHeader}</span>
                  <div className="flex items-center gap-2 font-semibold">
                    {dayTotalIncome > 0 && (
                      <span className="text-emerald-600">+{formatINR(dayTotalIncome)}</span>
                    )}
                    {dayTotalSpend > 0 && (
                      <span className="text-neutral-500">-{formatINR(dayTotalSpend)}</span>
                    )}
                  </div>
                </div>

                {/* Day Items */}
                <div className="divide-y divide-neutral-50">
                  {dayTxList.map((tx) => (
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
                          <div className="text-xs font-bold text-neutral-900 truncate max-w-[170px]">
                            {tx.merchant || tx.source || tx.category}
                          </div>
                          <div className="text-[10px] text-neutral-400 capitalize">
                            {tx.paymentMethod} {tx.note ? `· ${tx.note}` : ''}
                          </div>
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
                        <span className="text-[10px] text-neutral-400 capitalize">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
