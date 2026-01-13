import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('admin');

  return (
    <header className="bg-white dark:bg-slate-800 border-b-4 border-amber-400 sticky top-0 z-10 shadow-sm transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-bold text-slate-700 dark:text-slate-100 text-2xl brand-font tracking-tight uppercase">GodFirst</span>
          <span className="text-sky-500 text-[0.65rem] font-bold uppercase tracking-[0.2em] -mt-0.5">Church Barry</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          <nav>
            {isAdmin ? (
              <Link to="/" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600">
                Back to Player
              </Link>
            ) : (
              <Link to="/admin" className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors">
                Admin Area
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;