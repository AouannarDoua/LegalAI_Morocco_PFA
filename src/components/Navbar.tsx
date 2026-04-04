import React from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-40 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher une décision, un article ou un document..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-200 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <button className="flex items-center gap-3 hover:bg-gray-50 p-1 pr-2 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            AM
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">DOUA AOUANNAR</p>
            <p className="text-xs text-gray-500 mt-1">Avocat_</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
