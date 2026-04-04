import { LegalDecision, LegalArticle, Contract, Notification } from '../types';

export const mockDecisions: LegalDecision[] = [
  {
    id: '1',
    title: 'Licenciement pour faute grave - Cour de Cassation',
    court: 'Cour de Cassation, Casablanca',
    date: '2023-11-15',
    type: 'Droit du Travail',
    summary: 'La cour confirme que le vol de matériel de l\'entreprise constitue une faute grave justifiant un licenciement sans indemnité.',
    content: 'Texte complet de la décision juridique concernant le licenciement pour faute grave...',
    relatedDecisions: ['2', '5']
  },
  {
    id: '2',
    title: 'Indemnité de préavis et dommages-intérêts',
    court: 'Tribunal de Première Instance, Rabat',
    date: '2023-10-20',
    type: 'Droit du Travail',
    summary: 'Le tribunal a accordé des indemnités au salarié suite à un licenciement jugé abusif pour non-respect de la procédure.',
    content: 'Détails de la procédure de licenciement et calcul des indemnités...',
  },
  {
    id: '3',
    title: 'Litige Commercial - Rupture de contrat',
    court: 'Tribunal de Commerce, Tanger',
    date: '2023-09-05',
    type: 'Droit Commercial',
    summary: 'Rupture brutale des relations commerciales établies sans préavis suffisant.',
    content: 'Analyse de la rupture de contrat entre deux sociétés marocaines...',
  }
];

export const mockArticles: LegalArticle[] = [
  {
    id: 'art-1',
    title: 'Code du Travail - Article 39',
    category: 'Droit du Travail',
    content: 'Sont considérées comme fautes graves pouvant provoquer le licenciement du salarié...',
    lastUpdated: '2024-01-01'
  },
  {
    id: 'art-2',
    title: 'Loi 17-95 sur les Sociétés Anonymes',
    category: 'Droit des Sociétés',
    content: 'Dispositions générales concernant la constitution des sociétés anonymes au Maroc...',
    lastUpdated: '2023-12-15'
  }
];

export const mockContracts: Contract[] = [
  {
    id: 'c-1',
    title: 'Contrat de Travail CDI - Ahmed Mansouri',
    type: 'CDI',
    createdAt: '2024-02-10',
    status: 'final'
  },
  {
    id: 'c-2',
    title: 'Accord de Confidentialité (NDA)',
    type: 'Commercial',
    createdAt: '2024-03-01',
    status: 'draft'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n-1',
    title: 'Nouvelle Décision de Justice',
    message: 'Une nouvelle décision concernant le droit du travail a été publiée.',
    type: 'info',
    timestamp: '2024-04-03T10:00:00Z',
    read: false
  },
  {
    id: 'n-2',
    title: 'Alerte Risque Contractuel',
    message: 'Le contrat "Accord de Confidentialité" présente des clauses à risque.',
    type: 'warning',
    timestamp: '2024-04-02T15:30:00Z',
    read: true
  }
];
