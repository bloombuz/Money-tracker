/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { AddSheet } from './components/AddSheet';
import { OpeningDebtModal } from './components/ConfirmationDialog';
import { HomeView } from './views/HomeView';
import { ActivityView } from './views/ActivityView';
import { DebtView } from './views/DebtView';
import { PlanView } from './views/PlanView';
import { Check, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    settings,
    confirmOpeningDebt,
    statusToast,
    authLoading,
  } = useFinance();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addInitialType, setAddInitialType] = useState<'expense' | 'income' | 'debt_payment'>('expense');

  const handleOpenAdd = (type: 'expense' | 'income' | 'debt_payment' = 'expense') => {
    setAddInitialType(type);
    setIsAddOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <span className="text-xs font-bold text-neutral-500 tracking-wide uppercase">
          Loading Money Plan...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex justify-center items-start sm:py-6 selection:bg-sky-200">
      {/* iPhone 13 Screen Container (390 x 844 CSS px) */}
      <main
        className="w-full max-w-[390px] min-h-screen sm:min-h-[844px] bg-[#F7F8FA] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-neutral-900/10 flex flex-col relative overflow-x-hidden"
        style={{
          paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
        }}
      >
        {/* Dynamic Notch / Island on simulated desktop container */}
        <div className="hidden sm:flex justify-center pt-1.5 pb-1">
          <div className="w-28 h-4 bg-neutral-900 rounded-full" />
        </div>

        {/* Global App Header */}
        <Header />

        {/* Active Tab Screen Content */}
        <div className="flex-1 overflow-y-auto">
          {currentTab === 'home' && (
            <HomeView
              onOpenAdd={handleOpenAdd}
              onNavigateToDebt={() => setCurrentTab('debt')}
              onNavigateToActivity={() => setCurrentTab('activity')}
              onNavigateToPlan={() => setCurrentTab('plan')}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView onOpenAdd={handleOpenAdd} />
          )}

          {currentTab === 'debt' && (
            <DebtView onOpenAdd={handleOpenAdd} />
          )}

          {currentTab === 'plan' && (
            <PlanView />
          )}
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenAdd={() => handleOpenAdd('expense')}
        />

        {/* One-handed Add Bottom Sheet */}
        <AddSheet
          isOpen={isAddOpen}
          initialType={addInitialType}
          onClose={() => setIsAddOpen(false)}
        />

        {/* First Setup Opening Debt Confirmation Dialog */}
        <OpeningDebtModal
          isOpen={!settings.openingDebtConfirmed}
          onConfirm={confirmOpeningDebt}
        />

        {/* Status Toast (e.g. "Saved") */}
        {statusToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-neutral-700">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{statusToast}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
