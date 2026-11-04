import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Header from './components/Header';
import Auth from './pages/Auth';
import Game from './pages/Game';
import Admin from './pages/Admin';
import Support from './pages/Support';
import { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.isBanned) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl block mb-4">🚫</span>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Account Banned</h2>
        <p className="text-gray-400">Your account has been suspended. Contact support for assistance.</p>
      </div>
    </div>
  );
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900">
      <Header />
      <main>{children}</main>
      <footer className="border-t border-indigo-800/30 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">🐘 Elephant Aviator — For entertainment purposes only</p>
          <p className="mt-1 text-gray-600 text-xs">Demo game with virtual currency. No real money involved.</p>
        </div>
      </footer>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Auth />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Game />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout>
              <Admin />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Support />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </AuthProvider>
  );
}
