import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_OPENING_DEBT,
  calculateDebtStatus,
  applyRepaymentToDebt,
  applyCardPurchase,
  calculatePlan,
  calculateMoveOut,
  calculateMonthTotals,
  formatINR,
  DebtItem,
  TransactionItem,
} from './finance';

test('Format INR with Indian digit grouping', () => {
  assert.equal(formatINR(348775), '₹3,48,775');
  assert.equal(formatINR(100000), '₹1,00,000');
  assert.equal(formatINR(50000), '₹50,000');
  assert.equal(formatINR(0), '₹0');
  assert.equal(formatINR(-1500), '-₹1,500');
});

test('Flow 2: Starting debt allocation and principal repayment', () => {
  const openingDebt = DEFAULT_OPENING_DEBT; // 348775
  const debts: DebtItem[] = [];

  // Initially: opening debt is ₹3,48,775, remainder is ₹3,48,775, total is ₹3,48,775
  const initialStatus = calculateDebtStatus(openingDebt, debts);
  assert.equal(initialStatus.debtToBreakDown, 348775);
  assert.equal(initialStatus.totalDebt, 348775);

  // Allocate ₹1,00,000 of starting debt to a loan
  const loan: DebtItem = {
    id: 'loan-1',
    type: 'loan',
    name: 'Personal Loan HDFC',
    assignedFromOpening: 100000,
    balance: 100000,
    monthlyEMI: 3500,
    interestRate: 12,
  };
  debts.push(loan);

  const allocatedStatus = calculateDebtStatus(openingDebt, debts);
  // Confirm remainder is ₹2,48,775 and total debt is still ₹3,48,775
  assert.equal(allocatedStatus.debtToBreakDown, 248775);
  assert.equal(allocatedStatus.totalDebt, 348775);

  // Record a ₹1,000 principal repayment
  const updatedLoan = applyRepaymentToDebt(debts[0], 1500, 1000); // 1500 total EMI payment, 1000 principal
  debts[0] = updatedLoan;

  const afterRepaymentStatus = calculateDebtStatus(openingDebt, debts);
  // Confirm total debt becomes ₹3,47,775
  assert.equal(updatedLoan.balance, 99000);
  assert.equal(afterRepaymentStatus.debtToBreakDown, 248775);
  assert.equal(afterRepaymentStatus.totalDebt, 347775);
});

test('Flow 3: Credit card purchase and bill payment cash flow', () => {
  const card: DebtItem = {
    id: 'card-1',
    type: 'credit_card',
    name: 'ICICI Amazon Pay',
    assignedFromOpening: 0,
    balance: 0,
    totalStatementDue: 0,
  };

  // Month 1 (2026-11): Log a ₹2,000 card purchase
  const purchaseTx: TransactionItem = {
    id: 'tx-1',
    type: 'expense',
    amount: 2000,
    merchant: 'Amazon India',
    category: 'shopping',
    paymentMethod: 'card',
    debtId: 'card-1',
    transactionDate: '2026-11-15',
    addedAt: '2026-11-15T10:00:00.000Z',
  };

  const cardAfterPurchase = applyCardPurchase(card, 2000);
  assert.equal(cardAfterPurchase.balance, 2000);

  // Month 2 (2026-12): Pay the ₹2,000 bill
  const paymentTx: TransactionItem = {
    id: 'tx-2',
    type: 'debt_payment',
    amount: 2000,
    merchant: 'ICICI Card Payment',
    category: 'debt',
    paymentMethod: 'netbanking',
    debtId: 'card-1',
    transactionDate: '2026-12-05',
    addedAt: '2026-12-05T09:00:00.000Z',
  };

  const cardAfterPayment = applyRepaymentToDebt(cardAfterPurchase, 2000);
  assert.equal(cardAfterPayment.balance, 0);

  const transactions = [purchaseTx, paymentTx];

  // In Month 1 (2026-11):
  // Everyday spend is 2000, but cash outflow is 0 (paid via card, not bank cash)
  const month1Totals = calculateMonthTotals(transactions, '2026-11');
  assert.equal(month1Totals.everydaySpend, 2000);
  assert.equal(month1Totals.totalCashOutflow, 0);

  // In Month 2 (2026-12):
  // Everyday spend is 0, but cash outflow is 2000 (actual bank outflow for bill payment)
  const month2Totals = calculateMonthTotals(transactions, '2026-12');
  assert.equal(month2Totals.everydaySpend, 0);
  assert.equal(month2Totals.debtPayments, 2000);
  assert.equal(month2Totals.totalCashOutflow, 2000);
});

test('Flow 4: Target monthly take-home income calculation', () => {
  // Enter ₹45,000 in monthly allocations before investment and a 10% investment target.
  // Confirm app calculates ₹50,000 as target monthly take-home income: 45000 / (1 - 0.10) = 50000.
  const planResult = calculatePlan({
    income: 40000,
    essentialsLivingCosts: 25000,
    currentHousingCost: 15000,
    discretionaryBudget: 10000,
    emergencyFundMonthly: 5000,
    extraDebtRepaymentMonthly: 5000,
    investmentTargetPercent: 10,
    debts: [],
    goals: [],
  });

  // Total allocations before investment: 25000 + 10000 + 5000 + 5000 = 45000
  assert.equal(planResult.totalAllocationsBeforeInvestment, 45000);
  // Target take-home income = 45000 / 0.9 = 50000
  assert.equal(planResult.targetTakeHomeIncome, 50000);
});

test('Bangalore move-out calculator calculations', () => {
  const moveOutInputs = {
    monthlyRent: 22000,
    maintenance: 3000,
    utilities: 2000,
    refundableDeposit: 100000,
    brokerage: 22000,
    movingCosts: 5000,
    setupCosts: 15000,
    overlapRent: 10000,
    currentRent: 12000,
    currentMaintenance: 1000,
    currentUtilities: 1500,
  };

  const planInputs = {
    income: 70000,
    essentialsLivingCosts: 30000, // Includes 14500 current housing
    currentHousingCost: 14500,
    discretionaryBudget: 10000,
    emergencyFundMonthly: 5000,
    extraDebtRepaymentMonthly: 0,
    investmentTargetPercent: 10,
    debts: [],
    goals: [],
  };

  const result = calculateMoveOut(moveOutInputs, planInputs);

  // 1. Cash needed before moving: deposit + 1st month rent + brokerage + moving + setup + overlap
  // 100000 + 22000 + 22000 + 5000 + 15000 + 10000 = 174000
  assert.equal(result.cashNeededBeforeMoving, 174000);

  // 2. Monthly housing cost after moving: 22000 + 3000 + 2000 = 27000
  assert.equal(result.monthlyHousingCostAfterMoving, 27000);

  // 3. Max base rent affordable:
  // Non-housing essentials = 30000 - 14500 = 15500.
  // Other allocations = 10000 (discretionary) + 5000 (emergency) + 7000 (10% investment) = 22000.
  // Recurring non-rent housing = 3000 (maint) + 2000 (util) = 5000.
  // Total committed before rent = 15500 + 22000 + 5000 = 42500.
  // Max affordable base rent = 70000 - 42500 = 27500.
  assert.equal(result.maxBaseRentAffordable, 27500);
});
