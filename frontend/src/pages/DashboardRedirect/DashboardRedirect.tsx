import { Navigate } from 'react-router';

export default function DashboardRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!user?.role) {
    return <Navigate to='/login' replace />;
  }

  if (user.role === 'MANAGER') {
    return <Navigate to='/stock' replace />;
  }

  if (user.role === 'OPERATOR') {
    return <Navigate to='/operateur' replace />;
  }

  return <Navigate to='/login' replace />;
}
