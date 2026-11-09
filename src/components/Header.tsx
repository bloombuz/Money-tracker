import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Bell, CloudCheck, CloudOff, Download, User as UserIcon, LogIn, LogOut } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user, firestoreConnected, signInWithGoogle, logOut, exportCSV } = useFinance();

  return (
    <header className="pt-2 pb-3 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-neutral-200"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-200 to-indigo-100 flex items-center justify-center text-sky-900 font-semibold shadow-sm border-2 border-white">
            <span className="text-base font-bold">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'MP'}
            </span>
          </div>
        )}
        <div>
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            {subtitle || 'Bangalore, KA'}
          </div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            {title || (user?.displayName ? `Hello, ${user.displayName.split(' ')[0]}` : 'Hello, Friend')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={exportCSV}
          title="Export CSV"
          aria-label="Export CSV"
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-200/80 flex items-center justify-center text-neutral-750 active:scale-95 transition-transform"
        >
          <Download className="w-4 h-4 text-neutral-600" />
        </button>

        {user ? (
          <button
            onClick={logOut}
            title={`Signed in as ${user.email}. Click to sign out`}
            aria-label="Sign out"
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-200/80 flex items-center justify-center text-emerald-600 active:scale-95 transition-transform relative"
          >
            <CloudCheck className="w-4 h-4 text-emerald-600" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        ) : (
          <button
            onClick={signInWithGoogle}
            title="Sign in with Google to sync"
            aria-label="Sign in with Google"
            className="h-10 px-3 rounded-full bg-white shadow-sm border border-neutral-200/80 flex items-center gap-1.5 text-xs font-semibold text-neutral-700 active:scale-95 transition-transform"
          >
            <LogIn className="w-3.5 h-3.5 text-sky-600" />
            <span>Sync</span>
          </button>
        )}
      </div>
    </header>
  );
};
