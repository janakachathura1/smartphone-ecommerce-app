import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-secondary-50">
    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
  </div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
}
