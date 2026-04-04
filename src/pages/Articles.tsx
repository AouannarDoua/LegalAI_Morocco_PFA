import React, { useState } from 'react';
import { Search, Scale, ChevronRight, BookOpen, Clock, Tag } from 'lucide-react';
import { mockArticles } from '../mockData';
import { cn } from '../lib/utils';

export default function Articles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const filteredArticles = mockArticles.filter(a => 
    (selectedCategory === 'Tous' || a.category === selectedCategory) &&
    (a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     a.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ['Tous', 'Droit du Travail', 'Droit des Sociétés', 'Droit Commercial', 'Fiscalité'];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Articles de loi & Codes</h1>
        <p className="text-gray-500 mt-1">Accédez rapidement aux textes de loi marocains mis à jour.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un article, un code ou un décret..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === cat 
                  ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20" 
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => (
          <div key={article.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-all">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {article.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">{article.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-6">
              {article.content}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Clock className="w-3 h-3" />
                Mis à jour le {article.lastUpdated}
              </div>
              <button className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                Lire l'article
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Aucun article trouvé pour votre recherche.</p>
        </div>
      )}
    </div>
  );
}
