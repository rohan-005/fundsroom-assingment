import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/common/BottomNav';
import Loader from './components/common/Loader';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import ChallansPage from './pages/ChallansPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader label="VERIFYING SYSTEM SESSION..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-black bg-grid-pattern text-zinc-100 flex flex-col selection:bg-brand-red selection:text-white">
      <main className="flex-1 pt-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/challans" element={<ChallansPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}
