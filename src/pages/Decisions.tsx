import React, { useState } from 'react';
import { Search, Filter, ChevronRight, Gavel, Calendar, MapPin, Tag } from 'lucide-react';
import { mockDecisions } from '../mockData';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Decisions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');

  const filteredDecisions = mockDecisions.filter(d => 
    (selectedType === 'Tous' || d.type === selectedType) &&
    (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     d.court.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const types = ['Tous', 'Droit du Travail', 'Droit Commercial', 'Droit Civil'];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Décisions juridiques</h1>
          <p className="text-gray-500 mt-1">Consultez et analysez les dernières décisions de justice au Maroc.</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par mot-clé, tribunal, numéro de dossier..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  selectedType === type 
                    ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider pl-4">Décision</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tribunal</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Type</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDecisions.map((decision) => (
                <tr key={decision.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <Gavel className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 line-clamp-1 max-w-xs">{decision.title}</span>
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {decision.court}
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {decision.date}
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {decision.type}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 pr-4 text-right">
                    <Link 
                      to={`/decisions/${decision.id}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Détails
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDecisions.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucune décision trouvée pour votre recherche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
