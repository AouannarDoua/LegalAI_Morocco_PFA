import React, { useState } from 'react';
import { Upload, FileSearch, ShieldAlert, CheckCircle, AlertTriangle, FileText, ArrowRight, Search, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function ContractAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleUpload = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        score: 72,
        risks: [
          { type: 'high', title: 'Clause de non-concurrence trop large', details: 'La clause ne précise pas de zone géographique limitée, ce qui pourrait la rendre nulle selon la jurisprudence marocaine.' },
          { type: 'medium', title: 'Absence de clause de force majeure', details: 'Il est recommandé d\'ajouter une clause de force majeure pour protéger l\'entreprise en cas d\'événements imprévus.' }
        ],
        positives: [
          { title: 'Conformité CNSS', details: 'Les mentions relatives aux cotisations sociales sont conformes.' },
          { title: 'Juridiction compétente', details: 'Le tribunal de commerce de Casablanca est correctement désigné.' }
        ]
      });
    }, 2500);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Analyse de Contrat par IA</h1>
        <p className="text-gray-500 mt-1">Téléchargez un contrat pour identifier les risques juridiques et les points d'amélioration.</p>
      </header>

      {!analysisResult && !isAnalyzing && (
        <div className="max-w-3xl mx-auto">
          <div 
            className="border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
            onClick={handleUpload}
          >
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Glissez votre document ici</h2>
            <p className="text-gray-500 mb-8">Supporte PDF, DOCX et images (JPG, PNG). Max 10MB.</p>
            <button className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
              Sélectionner un fichier
            </button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-900 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileSearch className="w-10 h-10 text-blue-900" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Analyse en cours...</h2>
            <p className="text-gray-500">Notre IA examine les clauses, vérifie la conformité et identifie les risques potentiels.</p>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
            ))}
          </div>
        </div>
      )}

      {analysisResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                  Risques identifiés
                </h2>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{analysisResult.risks.length} Alertes</span>
              </div>
              <div className="space-y-4">
                {analysisResult.risks.map((risk: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-xl border flex gap-4",
                    risk.type === 'high' ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      risk.type === 'high' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {risk.type === 'high' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{risk.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{risk.details}</p>
                      <button className="text-xs font-bold text-blue-600 mt-3 flex items-center gap-1 hover:underline">
                        Comment corriger ?
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                Points positifs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.positives.map((pos: any, idx: number) => (
                  <div key={idx} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm">{pos.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{pos.details}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Score de conformité</h3>
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * analysisResult.score) / 100} className="text-blue-900 transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-black text-gray-900">{analysisResult.score}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Votre contrat est globalement conforme mais nécessite quelques ajustements pour une protection optimale.
              </p>
              <button className="w-full mt-8 bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-all">
                Générer un rapport PDF
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Besoin d'une révision ?</h3>
              <p className="text-sm text-blue-100 leading-relaxed mb-6">
                Notre équipe de juristes partenaires peut réviser votre contrat sous 24h.
              </p>
              <button className="w-full bg-white text-blue-900 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                Contacter un expert
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
