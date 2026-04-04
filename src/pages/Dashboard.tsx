import React from 'react';
import { 
  FileText, 
  Gavel, 
  Activity, 
  Plus, 
  MessageSquare, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { mockDecisions, mockContracts, mockNotifications } from '../mockData';

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
        <ArrowUpRight className="w-3 h-3" />
        {trend}
      </span>
    </div>
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

import { cn } from '../lib/utils';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue, Ahmed</h1>
          <p className="text-gray-500 mt-1">Voici un aperçu de votre activité juridique aujourd'hui.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4" />
            Nouveau contrat
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-4 h-4" />
            Poser une question
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={FileText} 
          label="Documents générés" 
          value="24" 
          trend="+12%" 
          color="bg-blue-600" 
        />
        <StatCard 
          icon={Gavel} 
          label="Décisions consultées" 
          value="156" 
          trend="+5%" 
          color="bg-indigo-600" 
        />
        <StatCard 
          icon={Activity} 
          label="Analyses effectuées" 
          value="42" 
          trend="+18%" 
          color="bg-emerald-600" 
        />
        <StatCard 
          icon={Clock} 
          label="Temps gagné (h)" 
          value="12.5" 
          trend="+24%" 
          color="bg-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Actions récentes</h2>
              <button className="text-sm text-blue-600 font-medium hover:underline">Voir tout</button>
            </div>
            <div className="divide-y divide-gray-50">
              {mockContracts.map((contract) => (
                <div key={contract.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{contract.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Généré le {contract.createdAt}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    contract.status === 'final' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {contract.status === 'final' ? 'Terminé' : 'Brouillon'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Décisions pertinentes</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {mockDecisions.slice(0, 2).map((decision) => (
                <div key={decision.id} className="p-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{decision.title}</h3>
                      <p className="text-xs text-gray-500">{decision.court} • {decision.date}</p>
                    </div>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                      {decision.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {decision.summary}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Notifications</h2>
            </div>
            <div className="p-4 space-y-4">
              {mockNotifications.map((notif) => (
                <div key={notif.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    notif.type === 'warning' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {notif.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2">Il y a 2 heures</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20">
            <h3 className="font-bold text-lg">Besoin d'aide ?</h3>
            <p className="text-blue-100 text-sm mt-2 leading-relaxed">
              Notre assistant IA est disponible 24/7 pour répondre à vos questions juridiques complexes.
            </p>
            <button className="w-full mt-6 bg-white text-blue-900 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
              Démarrer une discussion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
