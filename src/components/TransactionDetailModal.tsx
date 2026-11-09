import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionItem, formatINR } from '../utils/finance';
import { X, Trash2, Calendar, Clock, Edit3, Check } from 'lucide-react';
import { ConfirmDeleteDialog } from './ConfirmationDialog';

interface TransactionDetailModalProps {
  transaction: TransactionItem | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const { addOrUpdateTransaction, deleteTransaction, categories } = useFinance();

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Edit fields
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [title, setTitle] = useState(
    transaction?.merchant || transaction?.source || ''
  );
  const [category, setCategory] = useState(transaction?.category || 'other');
  const [paymentMethod, setPaymentMethod] = useState(
    transaction?.paymentMethod || 'upi'
  );
  const [transactionDate, setTransactionDate] = useState(
    transaction?.transactionDate || ''
  );
  const [note, setNote] = useState(transaction?.note || '');

  if (!transaction) return null;

  // Format ISO timestamp in Asia/Kolkata
  const formattedAddedAt = (() => {
    try {
      const d = new Date(transaction.addedAt);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return transaction.addedAt;
    }
  })();

  const handleSaveEdit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const updated: TransactionItem = {
      ...transaction,
      amount: numAmount,
      merchant: transaction.type !== 'income' ? title : undefined,
      source: transaction.type === 'income' ? title : undefined,
      category,
      paymentMethod,
      transactionDate,
      note: note.trim() || undefined,
      // Original addedAt is strictly preserved!
      addedAt: transaction.addedAt,
    };

    await addOrUpdateTransaction(updated);
    setIsEditing(false);
    onClose();
  };

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-detail-title"
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in"
      >
        <div
          className="w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                transaction.type === 'income'
                  ? 'bg-emerald-100 text-emerald-800'
                  : transaction.type === 'debt_payment'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {transaction.type.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowConfirmDelete(true)}
                aria-label="Delete transaction"
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {formatINR(transaction.amount)}
                </span>
                <h3 id="tx-detail-title" className="text-base font-bold text-neutral-700 mt-1">
                  {transaction.merchant || transaction.source || 'Transaction'}
                </h3>
              </div>

              <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-3 text-xs border border-neutral-150">
                <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                  <span className="text-neutral-400 font-medium">Category</span>
                  <span className="font-bold text-neutral-800 capitalize">
                    {transaction.category}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                  <span className="text-neutral-400 font-medium">Payment Method</span>
                  <span className="font-bold text-neutral-800 uppercase">
                    {transaction.paymentMethod}
                  </span>
                </div>

                {transaction.principalAmount !== undefined && (
                  <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                    <span className="text-neutral-400 font-medium">Principal Reduction</span>
                    <span className="font-bold text-sky-700">
                      {formatINR(transaction.principalAmount)}
                    </span>
                  </div>
                )}

                {transaction.interestAmount !== undefined && (
                  <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                    <span className="text-neutral-400 font-medium">Interest Portion</span>
                    <span className="font-bold text-neutral-700">
                      {formatINR(transaction.interestAmount)}
                    </span>
                  </div>
                )}

                {/* Editable Transaction Date */}
                <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                  <span className="text-neutral-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    Transaction Date
                  </span>
                  <span className="font-bold text-neutral-800">
                    {transaction.transactionDate}
                  </span>
                </div>

                {/* Immutable Original Date & Time Added */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    Original Date Added
                  </span>
                  <span className="font-semibold text-neutral-600 text-right">
                    {formattedAddedAt}
                  </span>
                </div>
              </div>

              {transaction.note && (
                <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 italic">
                  "{transaction.note}"
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Transaction</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                  Merchant / Source
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold capitalize bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                  Transaction Date (used for month filters)
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 bg-neutral-900 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={showConfirmDelete}
        title="Delete Transaction?"
        message="This transaction will be permanently removed. If this was a debt payment or credit card charge, balance adjustments will not be automatically rolled back."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};
