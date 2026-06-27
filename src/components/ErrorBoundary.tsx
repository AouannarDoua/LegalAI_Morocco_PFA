// src/components/ErrorBoundary.tsx
// ──────────────────────────────────────────────────────────────────────────────
// Filet de sécurité : si un composant lève une exception au rendu (ex : une
// donnée d'analyse mal formée), on affiche un message au lieu d'une PAGE BLANCHE.
// ──────────────────────────────────────────────────────────────────────────────
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "Erreur inattendue" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // visible dans la console du navigateur pour le débogage
    console.error("[ErrorBoundary]", error, info);
  }

  private reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">😕</p>
          <h2 className="text-lg font-bold text-red-800 mb-1">
            حدث خطأ أثناء عرض هذه الصفحة / Une erreur est survenue
          </h2>
          <p className="text-sm text-red-600 mb-4 break-words">{this.state.message}</p>
          <button
            onClick={this.reset}
            className="px-4 py-2 bg-mizan-600 hover:bg-mizan-700 text-white text-sm font-semibold rounded-lg"
          >
            إعادة المحاولة / Réessayer
          </button>
        </div>
      </div>
    );
  }
}
