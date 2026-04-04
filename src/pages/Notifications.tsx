import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle2, Clock, MoreHorizontal, Settings } from 'lucide-react';
import { mockNotifications } from '../mockData';
import { cn } from '../lib/utils';

export default function Notifications() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Restez informé des dernières mises à jour juridiques et de vos activités.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-gray-100">
            <Settings className="w-5 h-5" />
          </button>
          <button className="text-sm font-bold text-blue-600 hover:underline px-2">
            Tout marquer comme lu
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {mockNotifications.map((notif) => (
            <div key={notif.id} className={cn(
              "p-6 flex gap-6 transition-colors group relative",
              !notif.read ? "bg-blue-50/30" : "hover:bg-gray-50/50"
            )}>
              {!notif.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-900"></div>
              )}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                notif.type === 'warning' ? "bg-amber-50 text-amber-600" : 
                notif.type === 'error' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
              )}>
                {notif.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
                 notif.type === 'error' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-sm font-bold",
                    !notif.read ? "text-gray-900" : "text-gray-700"
                  )}>{notif.title}</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Il y a 2h
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed pr-8">{notif.message}</p>
                <div className="flex gap-4 pt-3">
                  <button className="text-xs font-bold text-blue-600 hover:underline">Voir les détails</button>
                  {!notif.read && <button className="text-xs font-bold text-gray-400 hover:text-gray-600">Marquer comme lu</button>}
                </div>
              </div>
              <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-8">
        <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
          Charger les notifications plus anciennes
        </button>
      </div>
    </div>
  );
}
