import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
import Layout from "./components/Layout"; // ton sidebar/navbar — adapte le nom
import TaxSimulator from "./pages/TaxSimulator";
import TaxAdmin from "./pages/TaxAdmin";

export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ Fix: AuthProvider englobe tout — useAuth accessible partout */}
      <AuthProvider>
        <Routes>

          {/* ── Routes publiques ─────────────────────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/confirm-email"   element={<ConfirmEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* ── Routes protégées — ProtectedRoute vérifie le token ────────── */}
          {/* ✅ Fix: isLoading spinner évite redirect prématuré après login  */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"          element={<Dashboard />} />
              <Route path="/chat"               element={<Chat />} />
              <Route path="/contracts"          element={<Contracts />} />
              <Route path="/tax-simulator" element={<TaxSimulator />} />
              <Route path="/contract-analysis"  element={<ContractAnalysis />} />
              <Route path="/contract-analysis/:id" element={<ContractAnalysis />} />
              <Route path="/contract-generator" element={<ContractGenerator />} />
              <Route path="/documents"          element={<Documents />} />
              <Route path="/decisions"          element={<Decisions />} />
              <Route path="/decisions/:id"      element={<DecisionDetails />} />
              <Route path="/articles"           element={<Articles />} />
              <Route path="/notifications"      element={<Notifications />} />
              <Route path="/profile"            element={<Profile />} /><Route path="/tax-admin" element={<TaxAdmin />} />
              <Route path="/tax-admin" element={<TaxAdmin />} />
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}