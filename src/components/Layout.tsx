import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion, AnimatePresence } from "motion/react";

export default function Layout() {
  // Sidebar réduite par défaut : icônes seulement. Ouvrable via le bouton.
  const [collapsed, setCollapsed] = useState(true);
  const pad = collapsed ? "ps-20" : "ps-64";

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Navbar collapsed={collapsed} />
      <main className={`relative pt-16 transition-[padding] duration-300 ${pad}`}>
        {/* texture zellige discrète, commune à toutes les pages internes */}
        <div className={`zellij-bg pointer-events-none fixed inset-0 pt-16 opacity-[0.6] [mask-image:linear-gradient(180deg,#000,transparent_60%)] transition-[padding] duration-300 ${pad}`} />
        <img src="/armoiries-maroc.png" alt="" aria-hidden
          className="pointer-events-none fixed bottom-6 end-6 hidden w-56 object-contain opacity-[0.05] lg:block" />
        <div className="relative mx-auto max-w-7xl p-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}