import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Gavel, Calendar, MapPin, Share2, Printer, Download, Sparkles, Scale, ChevronRight } from 'lucide-react';
import { mockDecisions } from '../mockData';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function DecisionDetails() {
  const { id } = useParams();
  const decision = mockDecisions.find(d => d.id === id);

  if (!decision) return <div>Décision non trouvée</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <Link to="/decisions" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour aux décisions
        </Link>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-gray-100">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-gray-100">
            <Printer className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-700">
                {decision.type}
              </span>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{decision.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {decision.court}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {decision.date}
                </div>
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-blue-600" />
                  Dossier N° 2023/156/45
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-50"></div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Texte de la décision</h2>
              <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed space-y-4">
                <p><strong>ATTENDU QUE</strong> le demandeur a déposé une requête en date du {decision.date} concernant un litige de travail relatif à un licenciement pour faute grave.</p>
                <p><strong>CONSIDÉRANT QUE</strong> l'article 39 du Code du Travail stipule que le vol de matériel appartenant à l'employeur constitue une faute grave justifiant la rupture immédiate du contrat de travail sans préavis ni indemnité.</p>
                <p><strong>PAR CES MOTIFS</strong>, le tribunal, statuant publiquement, en premier ressort et contradictoirement :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Déclare la demande recevable en la forme.</li>
                  <li>Au fond, confirme la légitimité du licenciement pour faute grave.</li>
                  <li>Déboute le salarié de ses demandes d'indemnités de préavis et de dommages-intérêts.</li>
                  <li>Condamne le demandeur aux dépens.</li>
                </ul>
                <p>{decision.content}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-300" />
              <h3 className="text-lg font-bold">Résumé par IA</h3>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">
              Cette décision confirme la jurisprudence constante sur la faute grave en cas de vol. Le tribunal a mis l'accent sur la preuve matérielle fournie par l'employeur et le respect des délais de notification.
            </p>
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300">Points clés</h4>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                <p className="text-xs text-blue-50">Qualification de la faute grave confirmée.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <p className="text-xs text-blue-50">Respect de la procédure disciplinaire (Art. 62).</p>
              </div>
            </div>
          </div>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900">Décisions similaires</h3>
            <div className="space-y-4">
              {mockDecisions.filter(d => d.id !== id).map(d => (
                <Link key={d.id} to={`/decisions/${d.id}`} className="block group">
                  <div className="p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{d.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{d.court}</p>
                  </div>
                </Link>
              ))}
            </div>
            <button className="w-full text-center text-sm font-bold text-blue-600 hover:underline pt-2">
              Voir plus de résultats
            </button>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900">Articles de loi cités</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-900">Article 39 - Code du Travail</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-900">Article 62 - Code du Travail</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
