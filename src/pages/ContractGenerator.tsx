import React, { useState } from 'react';
import { FilePlus, Download, Eye, CheckCircle2, AlertCircle, ChevronRight, FileText, Settings, User, Briefcase, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function ContractGenerator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'CDI',
    employeeName: '',
    position: '',
    salary: '',
    startDate: '',
    probationPeriod: '3 mois',
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Générateur de Contrat Intelligent</h1>
        <p className="text-gray-500">Créez des contrats conformes au droit marocain en quelques minutes.</p>
      </header>

      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              step >= s ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20" : "bg-gray-200 text-gray-500"
            )}>
              {s}
            </div>
            {s < 3 && <div className={cn("w-12 h-0.5 rounded-full", step > s ? "bg-blue-900" : "bg-gray-200")} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Informations de base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Type de contrat</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="CDI">CDI (Durée Indéterminée)</option>
                    <option value="CDD">CDD (Durée Déterminée)</option>
                    <option value="ANAPEC">Contrat ANAPEC</option>
                    <option value="STAGE">Convention de Stage</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nom complet du salarié</label>
                  <input 
                    type="text" 
                    placeholder="DOUA AOUANNAR"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Poste occupé</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Développeur Senior"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Date de début</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleNext}
                  className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Rémunération et Conditions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Salaire Brut (MAD)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 15000"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Période d'essai</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={formData.probationPeriod}
                    onChange={(e) => setFormData({...formData, probationPeriod: e.target.value})}
                  >
                    <option value="15 jours">15 jours</option>
                    <option value="1 mois">1 mois</option>
                    <option value="3 mois">3 mois</option>
                    <option value="6 mois">6 mois</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button 
                  onClick={handleBack}
                  className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Retour
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                  Générer l'aperçu
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Aperçu du contrat</h2>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 font-serif text-sm leading-relaxed text-gray-800 h-96 overflow-y-auto space-y-4">
                <h3 className="text-center font-bold text-lg uppercase underline">Contrat de Travail à Durée Indéterminée</h3>
                <p>ENTRE LES SOUSSIGNÉS :</p>
                <p>La société <strong>LegalAI Solutions SARL</strong>, sise à Casablanca, représentée par M. DOUA AOUANNAR, ci-après désignée "L'Employeur".</p>
                <p>ET :</p>
                <p>M. <strong>{formData.employeeName || "[Nom du salarié]"}</strong>, demeurant à [Adresse], ci-après désigné "Le Salarié".</p>
                <p>IL A ÉTÉ CONVENU CE QUI SUIT :</p>
                <p><strong>Article 1 : Engagement</strong><br />L'Employeur engage le Salarié en qualité de <strong>{formData.position || "[Poste]"}</strong> à compter du <strong>{formData.startDate || "[Date]"}</strong>.</p>
                <p><strong>Article 2 : Rémunération</strong><br />Le Salarié percevra une rémunération brute mensuelle de <strong>{formData.salary || "[Salaire]"} MAD</strong>.</p>
                <p><strong>Article 3 : Période d'essai</strong><br />Le présent contrat est conclu sous réserve d'une période d'essai de <strong>{formData.probationPeriod}</strong>.</p>
              </div>
              <div className="flex justify-between pt-4">
                <button 
                  onClick={handleBack}
                  className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Modifier
                </button>
                <button 
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  Finaliser et Télécharger
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Conseils Juridiques</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  La période d'essai pour un cadre en CDI au Maroc est de 3 mois renouvelable une fois.
                </p>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  N'oubliez pas d'inclure une clause de confidentialité si le poste est sensible.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">Besoin d'une clause spécifique ?</h3>
            <p className="text-xs text-blue-700 leading-relaxed mb-4">
              Demandez à notre IA de rédiger une clause sur mesure pour votre contrat.
            </p>
            <button className="text-sm font-bold text-blue-900 hover:underline flex items-center gap-1">
              Ouvrir l'assistant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
