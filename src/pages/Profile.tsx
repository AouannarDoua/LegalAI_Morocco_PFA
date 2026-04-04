import React from 'react';
import { Mail, Phone, Building2, MapPin, Shield, CreditCard, Bell, LogOut, Camera, ChevronRight, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles et les paramètres de votre compte.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700">
                AM
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-800 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900">DOUA AOUANNAR</h2>
            <p className="text-sm text-gray-500">Directeur RH • LegalAI Solutions</p>
            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">24</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Contrats</p>
              </div>
              <div className="w-px h-8 bg-gray-100"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">156</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Recherches</p>
              </div>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {[
              { icon: User, label: 'Informations personnelles', active: true },
              { icon: Building2, label: 'Détails de l\'entreprise', active: false },
              { icon: Shield, label: 'Sécurité et Mot de passe', active: false },
              { icon: Bell, label: 'Préférences de notification', active: false },
              { icon: CreditCard, label: 'Abonnement et Facturation', active: false },
            ].map((item, idx) => (
              <button 
                key={idx}
                className={cn(
                  "w-full flex items-center justify-between p-4 text-sm font-medium transition-colors",
                  item.active ? "bg-blue-50 text-blue-900" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Informations Personnelles</h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">Modifier</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prénom</label>
                <p className="text-sm font-semibold text-gray-900">DOUA</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nom</label>
                <p className="text-sm font-semibold text-gray-900">AOUANNAR</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">daouannar20@legalai.ma</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Téléphone</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">+212 6 00 00 00 00</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Informations de l'entreprise</h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">Modifier</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Raison Sociale</label>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">LegalAI Solutions SARL</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identifiant Commun (ICE)</label>
                <p className="text-sm font-semibold text-gray-900">001234567890001</p>
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Siège Social</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">Boulevard d'Anfa, Casablanca, Maroc</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
