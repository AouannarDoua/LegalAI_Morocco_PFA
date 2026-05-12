import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gavel, 
  FileText, 
  MessageSquare, 
  FilePlus, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Scale
} from 'lucide-react';
import { cn } from '../lib/utils';

import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  // '/' redirige vers 'dashboard' dans ton App.tsx, donc c'est OK
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' }, 
  { icon: Gavel, label: 'Décisions juridiques', path: '/decisions' },
  { icon: Scale, label: 'Articles de loi', path: '/articles' },
  { icon: MessageSquare, label: 'Assistant IA', path: '/chat' },
  // CORRECTION : Doit correspondre à path="contract-generator"
  { icon: FilePlus, label: 'Générateur de contrat', path: '/contract-generator' }, 
  // CORRECTION : Doit correspondre à path="contract-analysis"
  { icon: Search, label: 'Analyse de contrat', path: '/contract-analysis' }, 
  { icon: FileText, label: 'Mes documents', path: '/documents' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  // Dans Sidebar.tsx
  { icon: FileText, label: 'Mes Contrats', path: '/contracts' },
];

export default function Sidebar() {

const { logout } = useAuth();
const navigate = useNavigate();

const handleLogout = () => {
  logout();
  navigate("/login");
};

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center">
          <Scale className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl text-gray-900 tracking-tight">LegalAI</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-900 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-blue-50 text-blue-900" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )
          }
        >
          <User className="w-5 h-5" />
          Mon Profil
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 mt-1">
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
