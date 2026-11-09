import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../firebase/config';
import {
  DebtItem,
  TransactionItem,
  GoalItem,
  MoveOutInputs,
  PlanInputs,
  DEFAULT_OPENING_DEBT,
  calculateDebtStatus,
  calculatePlan,
  calculateMoveOut,
  calculateMonthTotals,
  applyRepaymentToDebt,
  applyCardPurchase,
} from '../utils/finance';

export interface UserSettingsData {
  openingDebtConfirmed: boolean;
  openingDebtAmount: number;
  incomeMode: 'manual' | 'average';
  manualTakeHomeIncome: number;
  essentialsLivingCosts: number;
  currentHousingCost: number;
  discretionaryBudget: number;
  emergencyFundMonthly: number;
  extraDebtRepaymentMonthly: number;
  investmentTargetPercent: number;
}

export const DEFAULT_GOALS: GoalItem[] = [
  {
    id: 'goal-phone',
    key: 'phone',
    title: 'New phone',
    targetAmount: 65000,
    currentSaved: 10000,
    targetDate: '2027-03-31',
    isActiveInPlan: true,
  },
  {
    id: 'goal-laptop',
    key: 'laptop',
    title: 'New laptop',
    targetAmount: 110000,
    currentSaved: 15000,
    targetDate: '2027-08-31',
    isActiveInPlan: false,
  },
  {
    id: 'goal-car',
    key: 'car',
    title: 'New car',
    targetAmount: 850000,
    currentSaved: 50000,
    targetDate: '2028-12-31',
    isActiveInPlan: false,
    carPurchaseType: 'emi',
    downPayment: 200000,
    monthlyEmi: 14500,
    runningCosts: 4500,
  },
  {
    id: 'goal-move-out',
    key: 'move_out',
    title: 'Move out',
    targetAmount: 160000,
    currentSaved: 25000,
    targetDate: '2027-05-31',
    isActiveInPlan: true,
  },
];

export const DEFAULT_MOVE_OUT: MoveOutInputs = {
  monthlyRent: 24000,
  maintenance: 3000,
  utilities: 2500,
  refundableDeposit: 120000,
  brokerage: 24000,
  movingCosts: 5000,
  setupCosts: 18000,
  overlapRent: 10000,
  currentRent: 14000,
  currentMaintenance: 1000,
  currentUtilities: 1500,
};

export const DEFAULT_SETTINGS: UserSettingsData = {
  openingDebtConfirmed: false,
  openingDebtAmount: DEFAULT_OPENING_DEBT,
  incomeMode: 'manual',
  manualTakeHomeIncome: 65000,
  essentialsLivingCosts: 26000,
  currentHousingCost: 16500,
  discretionaryBudget: 12000,
  emergencyFundMonthly: 4000,
  extraDebtRepaymentMonthly: 2500,
  investmentTargetPercent: 10,
};

interface FinanceContextType {
  user: User | null;
  authLoading: boolean;
  firestoreConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;

  // Data
  settings: UserSettingsData;
  debts: DebtItem[];
  transactions: TransactionItem[];
  goals: GoalItem[];
  moveOutCalc: MoveOutInputs;
  categories: string[];

  // Selected Month (YYYY-MM)
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Actions
  confirmOpeningDebt: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettingsData>) => Promise<void>;
  addOrUpdateDebt: (debt: DebtItem) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<void>;
  addOrUpdateTransaction: (tx: TransactionItem) => Promise<void>;
  deleteTransaction: (txId: string) => Promise<void>;
  addOrUpdateGoal: (goal: GoalItem) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateMoveOutCalc: (inputs: Partial<MoveOutInputs>) => Promise<void>;
  addCategory: (category: string) => void;

  // Calculated values
  effectiveTakeHomeIncome: number;
  averageCompletedMonthIncome: number;
  debtStatus: ReturnType<typeof calculateDebtStatus>;
  planSummary: ReturnType<typeof calculatePlan>;
  moveOutSummary: ReturnType<typeof calculateMoveOut>;
  currentMonthTotals: ReturnType<typeof calculateMonthTotals>;

  // Feedback & Status
  statusToast: string | null;
  showToast: (msg: string) => void;
  exportCSV: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const LOCAL_STORAGE_KEY = 'money_plan_offline_store_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreConnected, setFirestoreConnected] = useState(true);

  // Default month: Current year-month in Asia/Kolkata timezone
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    const m = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
    return `${y}-${m}`;
  });

  const [settings, setSettings] = useState<UserSettingsData>(DEFAULT_SETTINGS);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>(DEFAULT_GOALS);
  const [moveOutCalc, setMoveOutCalc] = useState<MoveOutInputs>(DEFAULT_MOVE_OUT);
  const [categories, setCategories] = useState<string[]>([
    'rent',
    'groceries',
    'eating out',
    'transport',
    'bills',
    'shopping',
    'health',
    'debt',
    'entertainment',
    'other',
  ]);

  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast(null);
    }, 2800);
  }, []);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.moveOutCalc) setMoveOutCalc(parsed.moveOutCalc);
        if (parsed.categories) setCategories(parsed.categories);
      }
    } catch (e) {
      console.warn('Failed to parse local storage cache', e);
    }
  }, []);

  // Sync to LocalStorage on changes
  useEffect(() => {
    try {
      const payload = {
        settings,
        debts,
        transactions,
        goals,
        moveOutCalc,
        categories,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to write to local storage', e);
    }
  }, [settings, debts, transactions, goals, moveOutCalc, categories]);

  // Auth & Connection Check
  useEffect(() => {
    testFirestoreConnection().then((ok) => setFirestoreConnected(ok));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Listeners when authenticated
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    // Listen to Settings
    const settingsRef = doc(db, 'users', uid, 'settings', 'finance');
    const unsubSettings = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserSettingsData;
          setSettings((prev) => ({ ...prev, ...data }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/settings/finance`);
      }
    );

    // Listen to Debts
    const debtsCol = collection(db, 'users', uid, 'debts');
    const unsubDebts = onSnapshot(
      debtsCol,
      (snapshot) => {
        const list: DebtItem[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as DebtItem));
        setDebts(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/debts`);
      }
    );

    // Listen to Transactions
    const txCol = collection(db, 'users', uid, 'transactions');
    const unsubTx = onSnapshot(
      txCol,
      (snapshot) => {
        const list: TransactionItem[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as TransactionItem));
        setTransactions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/transactions`);
      }
    );

    // Listen to Goals
    const goalsCol = collection(db, 'users', uid, 'goals');
    const unsubGoals = onSnapshot(
      goalsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: GoalItem[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as GoalItem));
          setGoals(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/goals`);
      }
    );

    // Listen to Move Out
    const moveOutRef = doc(db, 'users', uid, 'move_out_calc', 'default');
    const unsubMoveOut = onSnapshot(
      moveOutRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setMoveOutCalc(snapshot.data() as MoveOutInputs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/move_out_calc/default`);
      }
    );

    return () => {
      unsubSettings();
      unsubDebts();
      unsubTx();
      unsubGoals();
      unsubMoveOut();
    };
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in successfully');
    } catch (error) {
      console.error('Sign-in error:', error);
      showToast('Sign-in failed. Please retry.');
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const confirmOpeningDebt = async () => {
    const updated: UserSettingsData = {
      ...settings,
      openingDebtConfirmed: true,
      openingDebtAmount: DEFAULT_OPENING_DEBT,
    };
    setSettings(updated);
    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'settings', 'finance');
        await setDoc(ref, { ...updated, userId: user.uid }, { merge: true });
        showToast('Saved');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/settings/finance`);
      }
    } else {
      showToast('Saved');
    }
  };

  const updateSettings = async (newFields: Partial<UserSettingsData>) => {
    const updated = { ...settings, ...newFields };
    setSettings(updated);
    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'settings', 'finance');
        await setDoc(ref, { ...updated, userId: user.uid }, { merge: true });
        showToast('Saved');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/settings/finance`);
      }
    } else {
      showToast('Saved');
    }
  };

  const addOrUpdateDebt = async (debt: DebtItem) => {
    setDebts((prev) => {
      const idx = prev.findIndex((d) => d.id === debt.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = debt;
        return copy;
      }
      return [...prev, debt];
    });

    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'debts', debt.id);
        await setDoc(ref, { ...debt, userId: user.uid });
        showToast('Saved');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/debts/${debt.id}`);
      }
    } else {
      showToast('Saved');
    }
  };

  const deleteDebt = async (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'debts', debtId);
        await deleteDoc(ref);
        showToast('Deleted');
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/debts/${debtId}`);
      }
    } else {
      showToast('Deleted');
    }
  };

  const addOrUpdateTransaction = async (tx: TransactionItem) => {
    // Also update associated debt balance if relevant
    let updatedDebts = [...debts];

    if (tx.type === 'expense' && tx.paymentMethod === 'card' && tx.debtId) {
      // Credit card purchase increases card balance
      const cardIdx = updatedDebts.findIndex((d) => d.id === tx.debtId);
      if (cardIdx >= 0) {
        const updatedCard = applyCardPurchase(updatedDebts[cardIdx], tx.amount);
        updatedDebts[cardIdx] = updatedCard;
        if (user) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'debts', updatedCard.id), {
              ...updatedCard,
              userId: user.uid,
            });
          } catch (e) {
            console.error('Failed to sync card balance update', e);
          }
        }
      }
    } else if (tx.type === 'debt_payment' && tx.debtId) {
      // Debt payment: reduce loan or card balance
      const debtIdx = updatedDebts.findIndex((d) => d.id === tx.debtId);
      if (debtIdx >= 0) {
        const currentDebt = updatedDebts[debtIdx];
        const updatedDebt = applyRepaymentToDebt(
          currentDebt,
          tx.amount,
          tx.principalAmount
        );
        updatedDebts[debtIdx] = updatedDebt;
        if (user) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'debts', updatedDebt.id), {
              ...updatedDebt,
              userId: user.uid,
            });
          } catch (e) {
            console.error('Failed to sync debt repayment balance update', e);
          }
        }
      }
    }

    setDebts(updatedDebts);

    // Save transaction
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === tx.id);
      if (idx >= 0) {
        const copy = [...prev];
        // Preserve original addedAt if editing
        copy[idx] = { ...tx, addedAt: copy[idx].addedAt || tx.addedAt };
        return copy;
      }
      return [...prev, tx];
    });

    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'transactions', tx.id);
        await setDoc(ref, { ...tx, userId: user.uid });
        showToast('Saved');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/transactions/${tx.id}`);
      }
    } else {
      showToast('Saved');
    }
  };

  const deleteTransaction = async (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'transactions', txId);
        await deleteDoc(ref);
        showToast('Deleted');
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/transactions/${txId}`);
      }
    } else {
      showToast('Deleted');
    }
  };

  const addOrUpdateGoal = async (goal: GoalItem) => {
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = goal;
        return copy;
      }
      return [...prev, goal];
    });

    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'goals', goal.id);
        await setDoc(ref, { ...goal, userId: user.uid });
        showToast('Saved');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/goals/${goal.id}`);
      }
    } else {
      showToast('Saved');
    }
  };

  const deleteGoal = async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'goals', goalId);
        await deleteDoc(ref);
        showToast('Deleted');
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/goals/${goalId}`);
      }
    } else {
      showToast('Deleted');
    }
  };

  const updateMoveOutCalc = async (inputs: Partial<MoveOutInputs>) => {
    const updated = { ...moveOutCalc, ...inputs };
    setMoveOutCalc(updated);
    if (user) {
      try {
        const ref = doc(db, 'users', user.uid, 'move_out_calc', 'default');
        await setDoc(ref, { ...updated, userId: user.uid });
        showToast('Saved');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/move_out_calc/default`);
      }
    } else {
      showToast('Saved');
    }
  };

  const addCategory = (category: string) => {
    const clean = category.trim().toLowerCase();
    if (clean && !categories.includes(clean)) {
      setCategories((prev) => [...prev, clean]);
    }
  };

  // Calculate average income of completed months
  const averageCompletedMonthIncome = useMemo(() => {
    const incomeByMonth: Record<string, number> = {};
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    transactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        const m = t.transactionDate.substring(0, 7);
        // Completed months only (strictly before current month)
        if (m < currentMonthStr) {
          incomeByMonth[m] = (incomeByMonth[m] || 0) + t.amount;
        }
      });

    const months = Object.keys(incomeByMonth);
    if (months.length === 0) return 0;
    const total = Object.values(incomeByMonth).reduce((a, b) => a + b, 0);
    return Math.round(total / months.length);
  }, [transactions]);

  const effectiveTakeHomeIncome = useMemo(() => {
    if (settings.incomeMode === 'average' && averageCompletedMonthIncome > 0) {
      return averageCompletedMonthIncome;
    }
    return settings.manualTakeHomeIncome || 0;
  }, [settings.incomeMode, settings.manualTakeHomeIncome, averageCompletedMonthIncome]);

  // Debt calculations
  const debtStatus = useMemo(() => {
    return calculateDebtStatus(settings.openingDebtAmount, debts);
  }, [settings.openingDebtAmount, debts]);

  // Plan Summary
  const planSummary = useMemo(() => {
    const planInputs: PlanInputs = {
      income: effectiveTakeHomeIncome,
      essentialsLivingCosts: settings.essentialsLivingCosts || 0,
      currentHousingCost: settings.currentHousingCost || 0,
      discretionaryBudget: settings.discretionaryBudget || 0,
      emergencyFundMonthly: settings.emergencyFundMonthly || 0,
      extraDebtRepaymentMonthly: settings.extraDebtRepaymentMonthly || 0,
      investmentTargetPercent: settings.investmentTargetPercent || 0,
      debts,
      goals,
    };
    return calculatePlan(planInputs);
  }, [effectiveTakeHomeIncome, settings, debts, goals]);

  // Move-out summary
  const moveOutSummary = useMemo(() => {
    const planInputs: PlanInputs = {
      income: effectiveTakeHomeIncome,
      essentialsLivingCosts: settings.essentialsLivingCosts || 0,
      currentHousingCost: settings.currentHousingCost || 0,
      discretionaryBudget: settings.discretionaryBudget || 0,
      emergencyFundMonthly: settings.emergencyFundMonthly || 0,
      extraDebtRepaymentMonthly: settings.extraDebtRepaymentMonthly || 0,
      investmentTargetPercent: settings.investmentTargetPercent || 0,
      debts,
      goals,
    };
    return calculateMoveOut(moveOutCalc, planInputs);
  }, [moveOutCalc, effectiveTakeHomeIncome, settings, debts, goals]);

  // Current Month Totals
  const currentMonthTotals = useMemo(() => {
    return calculateMonthTotals(transactions, selectedMonth);
  }, [transactions, selectedMonth]);

  // CSV Export
  const exportCSV = useCallback(() => {
    const rows: string[] = [];
    rows.push('Date,Type,Category,Merchant/Source,Payment Method,Amount,Principal,Interest,Note,AddedAt');

    transactions.forEach((t) => {
      const line = [
        t.transactionDate,
        t.type,
        `"${t.category || ''}"`,
        `"${t.merchant || t.source || ''}"`,
        t.paymentMethod,
        t.amount,
        t.principalAmount ?? '',
        t.interestAmount ?? '',
        `"${(t.note || '').replace(/"/g, '""')}"`,
        t.addedAt,
      ].join(',');
      rows.push(line);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `money_plan_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded');
  }, [transactions, selectedMonth, showToast]);

  return (
    <FinanceContext.Provider
      value={{
        user,
        authLoading,
        firestoreConnected,
        signInWithGoogle,
        logOut,
        settings,
        debts,
        transactions,
        goals,
        moveOutCalc,
        categories,
        selectedMonth,
        setSelectedMonth,
        confirmOpeningDebt,
        updateSettings,
        addOrUpdateDebt,
        deleteDebt,
        addOrUpdateTransaction,
        deleteTransaction,
        addOrUpdateGoal,
        deleteGoal,
        updateMoveOutCalc,
        addCategory,
        effectiveTakeHomeIncome,
        averageCompletedMonthIncome,
        debtStatus,
        planSummary,
        moveOutSummary,
        currentMonthTotals,
        statusToast,
        showToast,
        exportCSV,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
