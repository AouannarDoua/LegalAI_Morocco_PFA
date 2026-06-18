import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";

// ─── Page d'accueil (publique) ─────────────────────────────────────────────────
import Landing from "./pages/Landing";

// ─── Pages publiques ──────────────────────────────────────────────────────────
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ConfirmEmail   from "./pages/ConfirmEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";

// ─── Pages protégées ──────────────────────────────────────────────────────────
import Dashboard         from "./pages/Dashboard";
import Chat              from "./pages/Chat";
import Contracts         from "./pages/Contracts";
import ContractAnalysis  from "./pages/ContractAnalysis";
import ContractGenerator from "./pages/ContractGenerator";
import Documents         from "./pages/Documents";
import Decisions         from "./pages/Decisions";
import DecisionDetails   from "./pages/DecisionDetails";
import Articles          from "./pages/Articles";
import Notifications     from "./pages/Notifications";
import Profile           from "./pages/Profile";

// ─── Layout ───────────────────────────────────────────────────────────────────
import Layout from "./components/Layout";
import TaxSimulator from "./pages/TaxSimulator";
import TaxAdmin from "./pages/TaxAdmin";

export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ LanguageProvider englobe tout — FR/AR + RTL accessibles partout */}
      <LanguageProvider>
        <AuthProvider>
          <Routes>

            {/* ── Accueil public (présentation de l'app) ─────────────────────── */}
            <Route path="/" element={<Landing />} />

            {/* ── Routes publiques ───────────────────────────────────────────── */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/confirm-email"   element={<ConfirmEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* ── Routes protégées ───────────────────────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard"             element={<Dashboard />} />
                <Route path="/chat"                  element={<Chat />} />
                <Route path="/contracts"             element={<Contracts />} />
                <Route path="/tax-simulator"         element={<TaxSimulator />} />
                <Route path="/contract-analysis"     element={<ContractAnalysis />} />
                <Route path="/contract-analysis/:id" element={<ContractAnalysis />} />
                <Route path="/contract-generator"    element={<ContractGenerator />} />
                <Route path="/documents"             element={<Documents />} />
                <Route path="/decisions"             element={<Decisions />} />
                <Route path="/decisions/:id"         element={<DecisionDetails />} />
                <Route path="/articles"              element={<Articles />} />
                <Route path="/notifications"         element={<Notifications />} />
                <Route path="/profile"               element={<Profile />} />
                <Route path="/tax-admin"             element={<TaxAdmin />} />
              </Route>
            </Route>

            {/* ── Fallback ───────────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
