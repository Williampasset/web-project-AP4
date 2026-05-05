import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import Navbar from '../navbar/Navbar';
import './DefaultLayout.css';

interface DefaultLayoutProps {
  children?: React.ReactNode;
  userName?: string;
  userRole?: 'MANAGER' | 'MAGASINIER';
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({
  children,
  userName,
  userRole = 'MANAGER',
}) => {
  const navigate = useNavigate();

  const user = React.useMemo(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  }, []);

  const finalUserName = userName || user?.firstName || 'Utilisateur';
  const finalUserRole = userRole || user?.role || 'MANAGER';

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    toast.success('Déconnexion réussie');

    navigate('/login');
  }, [navigate]);

  return (
    <div className='layout-container'>
      <Navbar
        logo='Warehouse'
        userName={finalUserName}
        userRole={finalUserRole}
        onLogout={handleLogout}
      />
      <main className='main-content'>{children}</main>
    </div>
  );
};

export default DefaultLayout;
