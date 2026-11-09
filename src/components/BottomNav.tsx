import React from 'react';
import { Home, ReceiptText, Plus, ShieldAlert, Target } from 'lucide-react';

export type TabType = 'home' | 'activity' | 'debt' | 'plan';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAdd,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-neutral-200/60 pt-2 px-6 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      aria-label="Bottom Navigation"
    >
      <div className="max-w-[390px] mx-auto flex items-center justify-between">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          aria-label="Home"
          className={`flex flex-col items-center justify-center w-12 py-1 transition-colors ${
            currentTab === 'home' ? 'text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
              currentTab === 'home' ? 'bg-neutral-100 scale-105' : ''
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* Activity */}
        <button
          onClick={() => onSelectTab('activity')}
          aria-label="Activity"
          className={`flex flex-col items-center justify-center w-12 py-1 transition-colors ${
            currentTab === 'activity' ? 'text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
              currentTab === 'activity' ? 'bg-neutral-100 scale-105' : ''
            }`}
          >
            <ReceiptText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Activity</span>
        </button>

        {/* Prominent Plus Button */}
        <div className="relative -top-2 flex flex-col items-center">
          <button
            onClick={onOpenAdd}
            aria-label="Add transaction or payment"
            className="w-14 h-14 rounded-full bg-neutral-950 text-white flex items-center justify-center shadow-lg shadow-neutral-950/20 active:scale-90 transition-transform ring-4 ring-[#F7F8FA]"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Debt */}
        <button
          onClick={() => onSelectTab('debt')}
          aria-label="Debt"
          className={`flex flex-col items-center justify-center w-12 py-1 transition-colors ${
            currentTab === 'debt' ? 'text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
              currentTab === 'debt' ? 'bg-neutral-100 scale-105' : ''
            }`}
          >
            <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Debt</span>
        </button>

        {/* Plan */}
        <button
          onClick={() => onSelectTab('plan')}
          aria-label="Plan"
          className={`flex flex-col items-center justify-center w-12 py-1 transition-colors ${
            currentTab === 'plan' ? 'text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
              currentTab === 'plan' ? 'bg-neutral-100 scale-105' : ''
            }`}
          >
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Plan</span>
        </button>
      </div>
    </nav>
  );
};
