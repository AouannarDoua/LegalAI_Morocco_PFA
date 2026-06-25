import api from "./apiClient";
import type { PaginatedData } from "./apiClient";

// Définition de l'interface Article pour correspondre à Articles.tsx
export interface Article {
  id: number;
  title: string;
  content?: string;
  category: string | null;
  author?: string | null;
  image_url?: string;
  published: boolean;
  created_at: string;
}

export const articleService = {
  /**
   * Récupère la liste des articles avec pagination et filtrage.
   * Articles.tsx utilise 'page' et 'category'.
   */
  list: (page = 1, category?: string, q?: string): Promise<PaginatedData<Article>> => {
    const params = new URLSearchParams({ page: String(page) });
    
    // Si une catégorie est sélectionnée (et n'est pas "Tous"), on l'ajoute aux params[cite: 1]
    if (category && category !== "Tous") {
      params.set("category", category);
    }
    if (q && q.trim()) {
      params.set("q", q.trim());
    }
    
    return api.get<PaginatedData<Article>>(`articles?${params}`);
  },

  /**
   * Récupère un article spécifique par son ID.
   */
  getById: (id: number): Promise<Article> =>
    api.get<Article>(`articles/${id}`),

  /**
   * Catégories réellement présentes en base (pour les filtres dynamiques).
   */
  categories: (): Promise<string[]> =>
    api.get<string[]>(`articles/categories`),
};

export default articleService;