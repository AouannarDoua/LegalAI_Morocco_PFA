import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Decisions from './pages/Decisions';
import DecisionDetails from './pages/DecisionDetails';
import Articles from './pages/Articles';
import Chat from './pages/Chat';
import ContractGenerator from './pages/ContractGenerator';
import ContractAnalysis from './pages/ContractAnalysis';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  // Simple auth simulation (always logged in for demo)
  const isAuthenticated = true;

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="decisions" element={<Decisions />} />
          <Route path="decisions/:id" element={<DecisionDetails />} />
          <Route path="articles" element={<Articles />} />
          <Route path="chat" element={<Chat />} />
          <Route path="generator" element={<ContractGenerator />} />
          <Route path="analysis" element={<ContractAnalysis />} />
          <Route path="documents" element={<Documents />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
