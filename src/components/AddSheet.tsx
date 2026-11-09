import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, ArrowDownRight, ArrowUpRight, ShieldCheck, Check } from 'lucide-react';
import { TransactionItem } from '../utils/finance';

interface AddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'expense' | 'income' | 'debt_payment';
}

export const AddSheet: React.FC<AddSheetProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
}) => {
  const { debts, categories, addCategory, addOrUpdateTransaction } = useFinance();

  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'debt_payment'>(initialType);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState(''); // merchant or source
  const [category, setCategory] = useState(categories[0] || 'groceries');
  const [newCatInput, setNewCatInput] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'netbanking' | 'other'>('upi');
  const [selectedDebtId, setSelectedDebtId] = useState<string>(debts[0]?.id || '');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestAmount, setInterestAmount] = useState('');

  // Sync state whenever AddSheet is opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      if (debts.length > 0) {
        if (!selectedDebtId || !debts.some((d) => d.id === selectedDebtId)) {
          setSelectedDebtId(debts[0].id);
        }
      }
    }
  }, [isOpen, initialType, debts, selectedDebtId]);

  const [date, setDate] = useState(() => {
    const now = new Date();
    const y = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    const m = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
    const d = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit' });
    return `${y}-${m}-${d}`;
  });
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    const addedAtIso = new Date().toISOString();
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newTx: TransactionItem = {
      id: txId,
      type: activeTab,
      amount: numAmount,
      transactionDate: date,
      addedAt: addedAtIso,
      note: note.trim() || undefined,
      paymentMethod,
      category: activeTab === 'income' ? 'income' : (activeTab === 'debt_payment' ? 'debt' : category),
    };

    if (activeTab === 'income') {
      newTx.source = title.trim() || 'Income';
    } else if (activeTab === 'expense') {
      newTx.merchant = title.trim() || 'Expense';
      if (paymentMethod === 'card' && selectedDebtId) {
        newTx.debtId = selectedDebtId;
      }
    } else if (activeTab === 'debt_payment') {
      newTx.merchant = title.trim() || 'Debt Repayment';
      newTx.debtId = selectedDebtId;
      if (principalAmount) {
        newTx.principalAmount = parseFloat(principalAmount) || undefined;
      }
      if (interestAmount) {
        newTx.interestAmount = parseFloat(interestAmount) || undefined;
      }
    }

    try {
      await addOrUpdateTransaction(newTx);
      onClose();
      // Reset form
      setAmount('');
      setTitle('');
      setNote('');
      setPrincipalAmount('');
      setInterestAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = () => {
    if (newCatInput.trim()) {
      addCategory(newCatInput.trim());
      setCategory(newCatInput.trim().toLowerCase());
      setNewCatInput('');
      setShowAddCat(false);
    }
  };

  const cards = debts.filter((d) => d.type === 'credit_card');
  const selectedDebt = debts.find((d) => d.id === selectedDebtId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-sheet-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] shadow-2xl p-5 pb-8 overflow-y-auto max-h-[90vh]"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 id="add-sheet-title" className="text-lg font-bold text-neutral-900 tracking-tight">
            Add Record
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Mode Pills */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'expense'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Spend</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'income'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Income</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('debt_payment')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'debt_payment'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>Debt Pay</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 text-center border border-neutral-150">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Amount (₹)
            </label>
            <div className="flex items-center justify-center text-3xl font-extrabold text-neutral-900">
              <span className="text-neutral-400 mr-1 text-2xl">₹</span>
              <input
                type="number"
                data-testid="add-amount-input"
                step="any"
                inputMode="decimal"
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-48 text-center bg-transparent focus:outline-none placeholder:text-neutral-300 font-extrabold tracking-tight"
              />
            </div>
          </div>

          {/* Title / Merchant / Source */}
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1.5">
              {activeTab === 'income'
                ? 'Source (e.g. Salary, Client, Refund)'
                : activeTab === 'debt_payment'
                ? 'Payment Description / Note'
                : 'Merchant or Purpose (e.g. Swiggy, Cult.fit, Blinkit)'}
            </label>
            <input
              type="text"
              placeholder={
                activeTab === 'income'
                  ? 'Monthly Salary'
                  : activeTab === 'debt_payment'
                  ? 'Loan EMI / Credit Card Payment'
                  : 'Groceries at Nature Basket'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={activeTab !== 'debt_payment'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* SPEND SPECIFIC: Category chips */}
          {activeTab === 'expense' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-600">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="text-[11px] font-bold text-sky-600 hover:underline"
                >
                  + Add category
                </button>
              </div>

              {showAddCat && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                      category === cat
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DEBT PAYMENT SPECIFIC: Select Debt & Principal/Interest breakdown */}
          {activeTab === 'debt_payment' && (
            <div className="space-y-3 bg-[#EBF4FA] p-3.5 rounded-2xl border border-sky-200/60">
              <div>
                <label className="text-xs font-bold text-sky-950 block mb-1">
                  Select Loan or Credit Card
                </label>
                {debts.length === 0 ? (
                  <p className="text-xs text-sky-700">
                    No debts added yet. Go to the Debt tab to break down your loans or cards.
                  </p>
                ) : (
                  <select
                    value={selectedDebtId}
                    onChange={(e) => setSelectedDebtId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-sky-200 focus:outline-none"
                  >
                    {debts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type === 'loan' ? 'Loan' : 'Card'} · Bal: ₹{d.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedDebt?.type === 'loan' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Principal portion (₹)
                    </label>
                    <input
                      type="number"
                      data-testid="principal-amount-input"
                      step="any"
                      placeholder="e.g. 2500"
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                      Reduces outstanding loan
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Interest portion (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 1000"
                      value={interestAmount}
                      onChange={(e) => setInterestAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                      Bank financing fee
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Method (for Expense and Debt Payment) */}
          {activeTab !== 'income' && (
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {(['upi', 'card', 'cash', 'netbanking', 'other'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 rounded-xl text-xs font-medium capitalize border transition-all ${
                      paymentMethod === method
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:bg-neutral-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* If Spend paid with Card, associate with card balance */}
              {activeTab === 'expense' && paymentMethod === 'card' && cards.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-neutral-100 rounded-xl text-xs">
                  <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                    Charge to Credit Card:
                  </label>
                  <select
                    value={selectedDebtId}
                    onChange={(e) => setSelectedDebtId(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-medium"
                  >
                    <option value="">-- Select card --</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Counts as spend now; bill payment later is cash outflow.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="Split with friend, bill #, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 bg-neutral-900 text-white rounded-2xl font-bold text-sm shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Record</span>
          </button>
        </form>
      </div>
    </div>
  );
};
