import React from 'react';
import { RefreshCw, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'directory' | 'destinations' | 'calculator' | 'backend';
  setActiveTab: (tab: 'map' | 'directory' | 'destinations' | 'calculator' | 'backend') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  isDarkMode,
  toggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('map')}
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 text-left focus:outline-none"
        >
          SG ParkLive
        </button>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'map'
                ? 'border-emerald-600 text-slate-900 font-semibold dark:border-emerald-400 dark:text-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'directory'
                ? 'border-emerald-600 text-slate-900 font-semibold dark:border-emerald-400 dark:text-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Carpark Directory
          </button>
          <button
            onClick={() => setActiveTab('destinations')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'destinations'
                ? 'border-emerald-600 text-slate-900 font-semibold dark:border-emerald-400 dark:text-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Destination Finder
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'calculator'
                ? 'border-emerald-600 text-slate-900 font-semibold dark:border-emerald-400 dark:text-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Fee Estimator
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'backend'
                ? 'border-emerald-600 text-slate-900 font-semibold dark:border-emerald-400 dark:text-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Backend Bridge
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg shadow-sm transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh Live'}</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden items-center justify-between overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium no-scrollbar">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Live Map
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Directory
        </button>
        <button
          onClick={() => setActiveTab('destinations')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'destinations'
              ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Nearby
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Estimator
        </button>
        <button
          onClick={() => setActiveTab('backend')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'backend'
              ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Bridge
        </button>
      </div>
    </header>
  );
};
