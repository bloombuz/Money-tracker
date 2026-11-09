import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, GoalItem, calculateGoalMonthlyRequirement } from '../utils/finance';
import {
  Target,
  Sparkles,
  TrendingUp,
  Percent,
  Sliders,
  Home,
  Laptop,
  Smartphone,
  Car,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { MoveOutCalculatorModal } from '../components/MoveOutCalculatorModal';

export const PlanView: React.FC = () => {
  const {
    settings,
    updateSettings,
    goals,
    addOrUpdateGoal,
    deleteGoal,
    planSummary,
    effectiveTakeHomeIncome,
    averageCompletedMonthIncome,
    currentMonthTotals,
  } = useFinance();

  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [isAddingCustomGoal, setIsAddingCustomGoal] = useState(false);

  // Remaining optional spending this month = maxOptionalSpending - actual discretionary spending this month
  const remainingOptionalSpendingThisMonth = Math.max(
    0,
    planSummary.maxOptionalSpending - currentMonthTotals.everydaySpend
  );

  const handleToggleGoalActive = async (goal: GoalItem) => {
    await addOrUpdateGoal({
      ...goal,
      isActiveInPlan: !goal.isActiveInPlan,
    });
  };

  const getGoalIcon = (key: string) => {
    switch (key) {
      case 'phone':
        return <Smartphone className="w-4 h-4 text-sky-600" />;
      case 'laptop':
        return <Laptop className="w-4 h-4 text-indigo-600" />;
      case 'car':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'move_out':
        return <Home className="w-4 h-4 text-amber-600" />;
      default:
        return <Target className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Income Source Selector */}
      <div className="bg-white rounded-[28px] p-4 border border-neutral-150 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Planning Income
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-700">
            {settings.incomeMode === 'average'
              ? 'Using Average of Completed Months'
              : 'Using Manual Take-Home'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div>
            <div className="text-3xl font-black text-neutral-900 tracking-tight">
              {formatINR(effectiveTakeHomeIncome)}
            </div>
            <span className="text-[11px] text-neutral-400">Monthly take-home income</span>
          </div>

          <div className="flex gap-1 bg-neutral-100 p-1 rounded-2xl">
            <button
              onClick={() => updateSettings({ incomeMode: 'manual' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                settings.incomeMode === 'manual'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => updateSettings({ incomeMode: 'average' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                settings.incomeMode === 'average'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              Average ({formatINR(averageCompletedMonthIncome)})
            </button>
          </div>
        </div>

        {settings.incomeMode === 'manual' && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-neutral-600 shrink-0">
              Edit Monthly Take-Home (₹):
            </label>
            <input
              type="number"
              value={settings.manualTakeHomeIncome || ''}
              onChange={(e) =>
                updateSettings({ manualTakeHomeIncome: parseFloat(e.target.value) || 0 })
              }
              className="w-32 px-3 py-1.5 text-right font-bold text-sm bg-neutral-50 rounded-xl border border-neutral-200"
            />
          </div>
        )}
      </div>

      {/* Target Monthly Take-Home Income Card (Key formula check) */}
      <div className="bg-[#DDF0F8] border border-[#CBE5F6] rounded-[32px] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-sky-950 font-bold text-[11px] shadow-2xs">
            Target Take-Home Income
          </span>
          {planSummary.incomeGap > 0 ? (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
              Gap: {formatINR(planSummary.incomeGap)}/mo
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Plan fully funded
            </span>
          )}
        </div>

        <div className="my-1.5">
          <div className="text-[36px] font-black text-neutral-950 tracking-tight leading-none">
            {formatINR(planSummary.targetTakeHomeIncome)}
          </div>
          <p className="text-[11px] text-sky-900/80 mt-1 leading-snug">
            Formula: {formatINR(planSummary.totalAllocationsBeforeInvestment)} before investment ÷ (1 − {settings.investmentTargetPercent}%)
          </p>
        </div>

        {/* Breakdown of drivers */}
        <div className="mt-3.5 pt-3 border-t border-sky-200/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-sky-900/70 block">Essentials & Housing</span>
            <span className="font-bold text-sky-950">
              {formatINR(settings.essentialsLivingCosts)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-sky-900/70 block">Required Debt EMIs</span>
            <span className="font-bold text-sky-950">
              {formatINR(planSummary.requiredDebtPayments)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-sky-900/70 block">Active Goals Savings</span>
            <span className="font-bold text-sky-950">
              {formatINR(planSummary.activeGoalsMonthly)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-sky-900/70 block">Discretionary + Extra</span>
            <span className="font-bold text-sky-950">
              {formatINR(
                settings.discretionaryBudget +
                  settings.extraDebtRepaymentMonthly +
                  settings.emergencyFundMonthly
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Optional Spending & Investment Room */}
      <div className="grid grid-cols-2 gap-3">
        {/* Maximum Optional Spending */}
        <div className="bg-[#DCF3E2] border border-[#C5EBD0] rounded-[28px] p-4 shadow-xs">
          <span className="px-2 py-0.5 rounded-full bg-white/80 text-emerald-950 font-bold text-[10px] block w-fit mb-1 shadow-2xs">
            Optional Spending
          </span>
          <div className="text-xl font-black text-neutral-950 tracking-tight">
            {formatINR(planSummary.maxOptionalSpending)}
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200/60">
            <span className="text-[10px] text-emerald-900/80 block">Remaining this month</span>
            <span className="text-sm font-bold text-emerald-950">
              {formatINR(remainingOptionalSpendingThisMonth)}
            </span>
          </div>
        </div>

        {/* Investment Room */}
        <div className="bg-[#FEF7D9] border border-[#F6ECB8] rounded-[28px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="px-2 py-0.5 rounded-full bg-white/80 text-amber-950 font-bold text-[10px] block w-fit shadow-2xs">
              Investment Room
            </span>
            <span className="text-[10px] font-bold text-amber-900">
              {planSummary.investmentRoomPercent.toFixed(0)}%
            </span>
          </div>

          <div className="text-xl font-black text-neutral-950 tracking-tight">
            {formatINR(planSummary.investmentRoomAmount)}
          </div>

          <div className="mt-2 pt-2 border-t border-amber-200/60">
            <span className="text-[10px] text-amber-900/80 block">
              Target ({settings.investmentTargetPercent}%)
            </span>
            <span className="text-sm font-bold text-amber-950">
              {formatINR(planSummary.targetInvestmentAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Target Investment Slider & Allocations Setting */}
      <div className="bg-white rounded-[26px] p-4 border border-neutral-150 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-800">Target Investment Percentage</span>
          <span className="font-extrabold text-neutral-950">{settings.investmentTargetPercent}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={settings.investmentTargetPercent}
          onChange={(e) =>
            updateSettings({ investmentTargetPercent: parseInt(e.target.value) || 0 })
          }
          className="w-full accent-neutral-900"
        />

        <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs border-t border-neutral-100">
          <div>
            <label className="text-[11px] font-medium text-neutral-500 block mb-0.5">
              Essentials Living (₹)
            </label>
            <input
              type="number"
              value={settings.essentialsLivingCosts || ''}
              onChange={(e) =>
                updateSettings({ essentialsLivingCosts: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 block mb-0.5">
              Discretionary Budget (₹)
            </label>
            <input
              type="number"
              value={settings.discretionaryBudget || ''}
              onChange={(e) =>
                updateSettings({ discretionaryBudget: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 block mb-0.5">
              Emergency Fund (₹/mo)
            </label>
            <input
              type="number"
              value={settings.emergencyFundMonthly || ''}
              onChange={(e) =>
                updateSettings({ emergencyFundMonthly: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 block mb-0.5">
              Extra Debt Repay (₹/mo)
            </label>
            <input
              type="number"
              value={settings.extraDebtRepaymentMonthly || ''}
              onChange={(e) =>
                updateSettings({ extraDebtRepaymentMonthly: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 font-bold text-xs"
            />
          </div>
        </div>
      </div>

      {/* Bangalore Move-Out Feature Card */}
      <div
        onClick={() => setShowMoveOutModal(true)}
        className="bg-[#FDF0E6] border border-[#F8DCBF] rounded-[28px] p-4.5 shadow-xs cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-orange-800 shadow-2xs">
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-orange-950">
              Bangalore Move-Out Calculator
            </h3>
            <p className="text-[11px] text-orange-900/80">
              Deposit, brokerage, overlap & max affordable rent
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-900">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Financial Goals</h2>
            <p className="text-[10px] text-neutral-400">
              Toggle ON/OFF to compare what you can afford now vs later
            </p>
          </div>
          <button
            onClick={() => setIsAddingCustomGoal(true)}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            + Add goal
          </button>
        </div>

        <div className="space-y-2.5">
          {goals.map((goal) => {
            const { monthsRemaining, monthlySavings, progressPercent } =
              calculateGoalMonthlyRequirement(goal);

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-[26px] p-4 border transition-all ${
                  goal.isActiveInPlan
                    ? 'border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    : 'border-neutral-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-neutral-100 flex items-center justify-center shrink-0">
                      {getGoalIcon(goal.key)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-neutral-900">{goal.title}</h3>
                      <span className="text-[11px] text-neutral-400 block">
                        Target: {goal.targetAmount ? formatINR(goal.targetAmount) : 'Not set'} · Due: {goal.targetDate}
                      </span>
                    </div>
                  </div>

                  {/* Toggle ON/OFF switch */}
                  <button
                    onClick={() => handleToggleGoalActive(goal)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      goal.isActiveInPlan
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-150 text-neutral-500'
                    }`}
                  >
                    {goal.isActiveInPlan ? 'IN PLAN' : 'PAUSED'}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 mb-1">
                    <span>
                      Saved: {formatINR(goal.currentSaved)} ({progressPercent}%)
                    </span>
                    <span className="text-neutral-900 font-bold">
                      {formatINR(monthlySavings)} / mo ({monthsRemaining} mos)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Car EMI details if car */}
                {goal.key === 'car' && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                    <span>
                      Mode: {goal.carPurchaseType === 'emi' ? 'Down Payment + EMI' : 'Outright Buy'}
                    </span>
                    {goal.carPurchaseType === 'emi' && (
                      <span>
                        DP: {formatINR(goal.downPayment || 0)} · EMI: {formatINR(goal.monthlyEmi || 0)}
                      </span>
                    )}
                  </div>
                )}

                {/* Edit button */}
                <div className="mt-2 pt-2 border-t border-neutral-50 flex justify-end">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="text-[11px] font-bold text-sky-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MoveOutCalculatorModal
        isOpen={showMoveOutModal}
        onClose={() => setShowMoveOutModal(false)}
      />

      {/* Goal Edit Modal */}
      {(editingGoal || isAddingCustomGoal) && (
        <GoalEditModal
          goal={editingGoal}
          onClose={() => {
            setEditingGoal(null);
            setIsAddingCustomGoal(false);
          }}
          onSave={async (g) => {
            await addOrUpdateGoal(g);
            setEditingGoal(null);
            setIsAddingCustomGoal(false);
          }}
          onDelete={async (id) => {
            await deleteGoal(id);
            setEditingGoal(null);
            setIsAddingCustomGoal(false);
          }}
        />
      )}
    </div>
  );
};

interface GoalEditModalProps {
  goal: GoalItem | null;
  onClose: () => void;
  onSave: (goal: GoalItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const GoalEditModal: React.FC<GoalEditModalProps> = ({ goal, onClose, onSave, onDelete }) => {
  const isNew = !goal;
  const [title, setTitle] = useState(goal?.title || '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount ? String(goal.targetAmount) : '');
  const [currentSaved, setCurrentSaved] = useState(goal?.currentSaved ? String(goal.currentSaved) : '0');
  const [targetDate, setTargetDate] = useState(goal?.targetDate || '2027-12-31');
  const [isActiveInPlan, setIsActiveInPlan] = useState(goal?.isActiveInPlan ?? true);

  // Car specific
  const [carPurchaseType, setCarPurchaseType] = useState<'outright' | 'emi'>(
    goal?.carPurchaseType || 'outright'
  );
  const [downPayment, setDownPayment] = useState(goal?.downPayment ? String(goal.downPayment) : '');
  const [monthlyEmi, setMonthlyEmi] = useState(goal?.monthlyEmi ? String(goal.monthlyEmi) : '');
  const [runningCosts, setRunningCosts] = useState(goal?.runningCosts ? String(goal.runningCosts) : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount) || 0;
    const savedNum = parseFloat(currentSaved) || 0;

    const goalId = goal ? goal.id : 'goal_' + Date.now();
    const updated: GoalItem = {
      id: goalId,
      key: goal ? goal.key : 'custom',
      title: title.trim() || 'Custom Goal',
      targetAmount: targetNum,
      currentSaved: savedNum,
      targetDate,
      isActiveInPlan,
      carPurchaseType: goal?.key === 'car' ? carPurchaseType : undefined,
      downPayment: downPayment ? parseFloat(downPayment) : undefined,
      monthlyEmi: monthlyEmi ? parseFloat(monthlyEmi) : undefined,
      runningCosts: runningCosts ? parseFloat(runningCosts) : undefined,
    };

    await onSave(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-edit-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="goal-edit-title" className="text-base font-bold text-neutral-900 tracking-tight">
            {isNew ? 'Add Financial Goal' : `Edit ${goal.title}`}
          </h2>
          <div className="flex items-center gap-1">
            {!isNew && (
              <button
                type="button"
                onClick={() => onDelete(goal.id)}
                aria-label="Delete goal"
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Target Cost (₹)
              </label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Amount Saved So Far (₹)
              </label>
              <input
                type="number"
                value={currentSaved}
                onChange={(e) => setCurrentSaved(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-medium"
            />
          </div>

          {goal?.key === 'car' && (
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
              <label className="text-[11px] font-bold text-neutral-800 block">
                Car Purchase Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCarPurchaseType('outright')}
                  className={`py-1.5 rounded-xl font-bold text-xs ${
                    carPurchaseType === 'outright' ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-600'
                  }`}
                >
                  Outright Cash Buy
                </button>
                <button
                  type="button"
                  onClick={() => setCarPurchaseType('emi')}
                  className={`py-1.5 rounded-xl font-bold text-xs ${
                    carPurchaseType === 'emi' ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-600'
                  }`}
                >
                  Down Payment + EMI
                </button>
              </div>

              {carPurchaseType === 'emi' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      Down Pay (₹)
                    </label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      Car EMI (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyEmi}
                      onChange={(e) => setMonthlyEmi(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">
                      Running (₹)
                    </label>
                    <input
                      type="number"
                      value={runningCosts}
                      onChange={(e) => setRunningCosts(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Check className="w-4 h-4" />
              <span>Save Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
