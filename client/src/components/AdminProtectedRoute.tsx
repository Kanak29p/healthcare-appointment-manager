import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { FullUser } from '../services/api';
import { RefreshCw } from 'lucide-react';

export default function AdminProtectedRoute() {
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.getMe();
        if (res.user && res.user.role === 'ADMIN') {
          setUser(res.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Admin route auth check failed', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-indigo-550 mb-2" />
        <span className="text-slate-400 text-sm">Authorizing admin session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
