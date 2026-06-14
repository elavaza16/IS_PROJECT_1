import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Redirect volunteer away from community member home
  if (user.role === 'volunteer' && window.location.pathname === '/') {
    return <Navigate to="/volunteer" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to correct dashboard based on role
    if (user.role === 'admin')     return <Navigate to="/admin" replace />;
    if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;