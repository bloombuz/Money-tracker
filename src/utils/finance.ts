/**
 * Core financial calculations and formatters for Money Plan.
 * Built with pure logic decoupled from React for comprehensive unit testing.
 */

export const DEFAULT_OPENING_DEBT = 348775;

export interface DebtItem {
  id: string;
  userId?: string;
  type: 'loan' | 'credit_card';
  name: string;
  assignedFromOpening: number; // Amount carved out from starting debt
  isNewBorrowing?: boolean;
  balance: number; // Current outstanding balance/principal
  interestRate?: number;
  monthlyEMI?: number;
  dueDate?: string;
  nextDueDate?: string;
  totalStatementDue?: number;
  minimumDue?: number;
  statementMissing?: boolean;
}

export interface TransactionItem {
  id: string;
  userId?: string;
  type: 'income' | 'expense' | 'debt_payment';
  amount: number;
  source?: string;
  merchant?: string;
  category: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'netbanking' | 'other';
  cardId?: string;
  debtId?: string;
  principalAmount?: number;
  interestAmount?: number;
  transactionDate: string; // YYYY-MM-DD
  addedAt: string; // ISO string
  note?: string;
}

export interface GoalItem {
  id: string;
  userId?: string;
  key: string;
  title: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string; // YYYY-MM-DD
  isActiveInPlan: boolean;
  carPurchaseType?: 'outright' | 'emi';
  downPayment?: number;
  monthlyEmi?: number;
  runningCosts?: number;
}

export interface MoveOutInputs {
  monthlyRent: number;
  maintenance: number;
  utilities: number;
  refundableDeposit: number;
  brokerage: number;
  movingCosts: number;
  setupCosts: number;
  overlapRent: number;
  currentRent: number;
  currentMaintenance: number;
  currentUtilities: number;
}

export interface PlanInputs {
  income: number;
  essentialsLivingCosts: number; // non-housing essentials + current housing
  currentHousingCost: number;
  discretionaryBudget: number;
  emergencyFundMonthly: number;
  extraDebtRepaymentMonthly: number;
  investmentTargetPercent: number; // e.g. 10 for 10%
  debts: DebtItem[];
  goals: GoalItem[];
  referenceDate?: Date;
}

/**
 * Format a number using Indian Numbering System (e.g., ₹3,48,775)
 */
export function formatINR(amount: number, showSign = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absVal);

  if (isNegative) {
    return `-₹${formatted}`;
  }
  if (showSign && amount > 0) {
    return `+₹${formatted}`;
  }
  return `₹${formatted}`;
}

/**
 * Calculate Debt breakdown and total current debt.
 * Starting debt is openingDebt (₹3,48,775).
 * Portion assigned to specific loans/cards reduces the remainder ("Debt to break down").
 * Total debt is remainder + sum of current balances.
 */
export function calculateDebtStatus(
  openingDebt: number,
  debts: DebtItem[]
): {
  openingDebt: number;
  totalAssignedFromOpening: number;
  debtToBreakDown: number;
  totalCurrentDebts: number;
  totalDebt: number;
  totalMonthlyDue: number;
} {
  const totalAssignedFromOpening = debts
    .filter((d) => !d.isNewBorrowing)
    .reduce((sum, d) => sum + (d.assignedFromOpening || 0), 0);

  const debtToBreakDown = Math.max(0, openingDebt - totalAssignedFromOpening);

  const totalCurrentDebts = debts.reduce((sum, d) => sum + (d.balance || 0), 0);

  // Total debt = remaining unassigned opening debt + current active balances
  const totalDebt = debtToBreakDown + totalCurrentDebts;

  const totalMonthlyDue = debts.reduce((sum, d) => {
    if (d.type === 'loan') {
      return sum + (d.monthlyEMI || 0);
    }
    // Credit card: statement due or minimum due
    return sum + (d.totalStatementDue ?? d.minimumDue ?? 0);
  }, 0);

  return {
    openingDebt,
    totalAssignedFromOpening,
    debtToBreakDown,
    totalCurrentDebts,
    totalDebt,
    totalMonthlyDue,
  };
}

/**
 * Record a repayment on a debt item.
 * For a loan, reduces balance by principal portion.
 * For a credit card, reduces balance by amount paid.
 */
export function applyRepaymentToDebt(
  debt: DebtItem,
  totalPayment: number,
  principalPortion?: number
): DebtItem {
  if (debt.type === 'loan') {
    const reduction = principalPortion !== undefined ? principalPortion : totalPayment;
    const newBalance = Math.max(0, debt.balance - reduction);
    return {
      ...debt,
      balance: newBalance,
    };
  } else {
    // Credit card payment reduces card balance
    const newBalance = Math.max(0, debt.balance - totalPayment);
    return {
      ...debt,
      balance: newBalance,
      totalStatementDue: debt.totalStatementDue !== undefined
        ? Math.max(0, debt.totalStatementDue - totalPayment)
        : undefined,
    };
  }
}

/**
 * Apply a credit card purchase to increase its balance.
 */
export function applyCardPurchase(card: DebtItem, amount: number): DebtItem {
  if (card.type !== 'credit_card') return card;
  return {
    ...card,
    balance: card.balance + amount,
  };
}

/**
 * Calculate months between two dates (minimum 1 month for savings schedule).
 */
export function getMonthsRemaining(targetDateStr: string, fromDate = new Date()): number {
  if (!targetDateStr) return 1;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return 1;

  const yearDiff = target.getFullYear() - fromDate.getFullYear();
  const monthDiff = target.getMonth() - fromDate.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return Math.max(1, totalMonths);
}

/**
 * Calculate monthly savings needed for a goal.
 */
export function calculateGoalMonthlyRequirement(
  goal: GoalItem,
  referenceDate = new Date()
): {
  monthsRemaining: number;
  monthlySavings: number;
  progressPercent: number;
} {
  const monthsRemaining = getMonthsRemaining(goal.targetDate, referenceDate);
  const target = goal.targetAmount || 0;
  const saved = goal.currentSaved || 0;
  const needed = Math.max(0, target - saved);

  let monthlySavings = needed > 0 ? Math.ceil(needed / monthsRemaining) : 0;

  if (goal.carPurchaseType === 'emi') {
    const downPayment = goal.downPayment || 0;
    const dpNeeded = Math.max(0, downPayment - saved);
    const dpMonthly = dpNeeded > 0 ? Math.ceil(dpNeeded / monthsRemaining) : 0;
    const emi = goal.monthlyEmi || 0;
    const running = goal.runningCosts || 0;
    monthlySavings = dpMonthly + emi + running;
  }

  const progressPercent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

  return {
    monthsRemaining,
    monthlySavings,
    progressPercent,
  };
}

/**
 * Calculate the Plan outputs:
 * 1. Target monthly take-home income = Total allocations before investment / (1 - investmentTargetPercent/100)
 * 2. Maximum optional spending and remaining optional spending
 * 3. Investment room in rupees and percentage
 */
export function calculatePlan(inputs: PlanInputs): {
  requiredDebtPayments: number;
  activeGoalsMonthly: number;
  totalAllocationsBeforeInvestment: number;
  targetTakeHomeIncome: number;
  incomeGap: number; // targetTakeHomeIncome - actual income
  investmentRoomAmount: number;
  investmentRoomPercent: number;
  targetInvestmentAmount: number;
  isInvestmentTargetMet: boolean;
  shortfall: number;
  maxOptionalSpending: number;
} {
  const {
    income,
    essentialsLivingCosts,
    discretionaryBudget,
    emergencyFundMonthly,
    extraDebtRepaymentMonthly,
    investmentTargetPercent,
    debts,
    goals,
    referenceDate = new Date(),
  } = inputs;

  // Required monthly debt payments
  const requiredDebtPayments = debts.reduce((sum, d) => {
    if (d.type === 'loan') {
      return sum + (d.monthlyEMI || 0);
    }
    return sum + (d.totalStatementDue ?? d.minimumDue ?? 0);
  }, 0);

  // Active goals monthly contributions
  const activeGoalsMonthly = goals
    .filter((g) => g.isActiveInPlan)
    .reduce((sum, g) => {
      const { monthlySavings } = calculateGoalMonthlyRequirement(g, referenceDate);
      return sum + monthlySavings;
    }, 0);

  // Total allocations before investment:
  // essentials + required debt payments + extra debt payments + discretionary spending + emergency savings + active goals
  const totalAllocationsBeforeInvestment =
    essentialsLivingCosts +
    requiredDebtPayments +
    extraDebtRepaymentMonthly +
    discretionaryBudget +
    emergencyFundMonthly +
    activeGoalsMonthly;

  // Target monthly take-home income:
  // A_before / (1 - p)
  const p = Math.max(0, Math.min(0.99, (investmentTargetPercent || 0) / 100));
  const targetTakeHomeIncome = p < 1
    ? Math.round(totalAllocationsBeforeInvestment / (1 - p))
    : totalAllocationsBeforeInvestment;

  const incomeGap = Math.max(0, targetTakeHomeIncome - income);

  // Investment room with current income:
  // Available after essentials, debt payments, and other planned allocations
  const remainingCash = income - totalAllocationsBeforeInvestment;
  const targetInvestmentAmount = Math.round(income * p);

  let investmentRoomAmount = 0;
  let investmentRoomPercent = 0;
  let shortfall = 0;

  if (remainingCash <= 0) {
    investmentRoomAmount = 0;
    investmentRoomPercent = 0;
    shortfall = Math.abs(remainingCash);
  } else {
    investmentRoomAmount = remainingCash;
    investmentRoomPercent = income > 0 ? (remainingCash / income) * 100 : 0;
    shortfall = 0;
  }

  const isInvestmentTargetMet = investmentRoomAmount >= targetInvestmentAmount;

  // Maximum optional spending: discretionaryBudget
  const maxOptionalSpending = discretionaryBudget;

  return {
    requiredDebtPayments,
    activeGoalsMonthly,
    totalAllocationsBeforeInvestment,
    targetTakeHomeIncome,
    incomeGap,
    investmentRoomAmount,
    investmentRoomPercent,
    targetInvestmentAmount,
    isInvestmentTargetMet,
    shortfall,
    maxOptionalSpending,
  };
}

/**
 * Bangalore Move-out Calculator calculations:
 * 1. Cash needed before moving (deposit + 1st month rent + brokerage + moving + setup + overlap)
 * 2. Monthly housing cost after moving (rent + maintenance + utilities)
 * 3. Maximum base rent affordable under current plan
 */
export function calculateMoveOut(
  inputs: MoveOutInputs,
  planInputs: PlanInputs
): {
  cashNeededBeforeMoving: number;
  monthlyHousingCostAfterMoving: number;
  maxBaseRentAffordable: number;
  currentMonthlyHousingCost: number;
  monthlyCostDifference: number;
  afterMoveShortfall: number;
} {
  const {
    monthlyRent,
    maintenance,
    utilities,
    refundableDeposit,
    brokerage,
    movingCosts,
    setupCosts,
    overlapRent,
    currentRent,
    currentMaintenance,
    currentUtilities,
  } = inputs;

  // 1. Cash needed before moving:
  // Refundable deposit + upfront rent (1 month) + brokerage + moving + setup + overlap rent
  const cashNeededBeforeMoving =
    (refundableDeposit || 0) +
    (monthlyRent || 0) +
    (brokerage || 0) +
    (movingCosts || 0) +
    (setupCosts || 0) +
    (overlapRent || 0);

  // 2. Monthly housing cost after moving:
  const monthlyHousingCostAfterMoving =
    (monthlyRent || 0) + (maintenance || 0) + (utilities || 0);

  // Current housing cost:
  const currentMonthlyHousingCost =
    (currentRent || 0) + (currentMaintenance || 0) + (currentUtilities || 0);

  const monthlyCostDifference = monthlyHousingCostAfterMoving - currentMonthlyHousingCost;

  // 3. Maximum base rent affordable:
  // Non-housing essentials = planInputs.essentialsLivingCosts - currentMonthlyHousingCost
  const nonHousingEssentials = Math.max(
    0,
    planInputs.essentialsLivingCosts - currentMonthlyHousingCost
  );

  // Required debt payments
  const requiredDebt = planInputs.debts.reduce((sum, d) => {
    if (d.type === 'loan') return sum + (d.monthlyEMI || 0);
    return sum + (d.totalStatementDue ?? d.minimumDue ?? 0);
  }, 0);

  // Other selected allocations (extra debt, emergency, discretionary, active goals)
  const activeGoalsMonthly = planInputs.goals
    .filter((g) => g.isActiveInPlan && g.key !== 'move_out') // Exclude move_out itself
    .reduce((sum, g) => {
      const { monthlySavings } = calculateGoalMonthlyRequirement(g);
      return sum + monthlySavings;
    }, 0);

  const targetInvestment = Math.round(
    planInputs.income * ((planInputs.investmentTargetPercent || 0) / 100)
  );

  const otherAllocations =
    planInputs.extraDebtRepaymentMonthly +
    planInputs.discretionaryBudget +
    planInputs.emergencyFundMonthly +
    activeGoalsMonthly +
    targetInvestment;

  // Recurring housing costs OTHER than rent in new place:
  const recurringNonRentHousing = (maintenance || 0) + (utilities || 0);

  // Total committed before new base rent:
  const totalCommittedBeforeRent =
    nonHousingEssentials + requiredDebt + otherAllocations + recurringNonRentHousing;

  const maxBaseRentAffordable = Math.max(0, planInputs.income - totalCommittedBeforeRent);

  // After-move budget check:
  const totalAfterMoveExpenses =
    nonHousingEssentials +
    monthlyHousingCostAfterMoving +
    requiredDebt +
    otherAllocations;

  const afterMoveShortfall = Math.max(0, totalAfterMoveExpenses - planInputs.income);

  return {
    cashNeededBeforeMoving,
    monthlyHousingCostAfterMoving,
    maxBaseRentAffordable,
    currentMonthlyHousingCost,
    monthlyCostDifference,
    afterMoveShortfall,
  };
}

/**
 * Calculate Monthly Cash Inflow, Cash Outflow, and Net Cash Left for a given month (YYYY-MM).
 * Distinguishes everyday spending from debt repayments and card payments.
 */
export function calculateMonthTotals(
  transactions: TransactionItem[],
  monthStr: string // "YYYY-MM"
): {
  monthIncome: number;
  everydaySpend: number;
  debtPayments: number;
  totalCashOutflow: number;
  cashLeft: number;
} {
  const monthTx = transactions.filter((t) => t.transactionDate.startsWith(monthStr));

  const monthIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const everydaySpend = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const debtPayments = monthTx
    .filter((t) => t.type === 'debt_payment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Cash outflow = everyday spend (paid in cash/upi/etc.) + debt payments (including card bill payments).
  // Note: If an expense was made on credit card, everyday spending records the expense at purchase.
  // When the card bill is paid, type is 'debt_payment' which is actual cash outflow.
  // To avoid double-counting in cash flow:
  const cardExpenses = monthTx
    .filter((t) => t.type === 'expense' && t.paymentMethod === 'card')
    .reduce((sum, t) => sum + t.amount, 0);

  // Immediate cash spent this month (non-card expenses) + actual debt & card payments made this month
  const immediateCashExpenses = everydaySpend - cardExpenses;
  const totalCashOutflow = immediateCashExpenses + debtPayments;
  const cashLeft = monthIncome - totalCashOutflow;

  return {
    monthIncome,
    everydaySpend,
    debtPayments,
    totalCashOutflow,
    cashLeft,
  };
}
