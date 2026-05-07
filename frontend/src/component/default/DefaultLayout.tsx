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

  /**
   * Retrieves the user information from localStorage and parses it.
   * If the user information is not available or cannot be parsed, it returns null.
   * The user information is memoized to avoid unnecessary parsing on every render.
   * @returns The user object containing user details or null if not available
   */
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

  /**
   * Handles the user logout process by clearing relevant data from localStorage and sessionStorage,
   * displaying a success toast message, and navigating the user to the login page.
   * The function is memoized to prevent unnecessary re-creations on every render.
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    toast.success('Déconnexion réussie', { position: 'bottom-center' });

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
