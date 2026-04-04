import React from 'react';
import { FileText, Download, Trash2, Search, Filter, MoreVertical, Clock, CheckCircle2 } from 'lucide-react';
import { mockContracts } from '../mockData';
import { cn } from '../lib/utils';

export default function Documents() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Documents</h1>
          <p className="text-gray-500 mt-1">Gérez vos contrats, analyses et rapports générés sur la plateforme.</p>
        </div>
        <button className="bg-blue-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Nouveau document
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un document..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Trier par date
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Nom du document</th>
                <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Type</th>
                <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Date de création</th>
                <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Statut</th>
                <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockContracts.map((doc) => (
                <tr key={doc.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">{doc.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600 font-medium">{doc.type}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {doc.createdAt}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        doc.status === 'final' ? "bg-emerald-500" : "bg-amber-500"
                      )}></div>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        doc.status === 'final' ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {doc.status === 'final' ? 'Finalisé' : 'Brouillon'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
