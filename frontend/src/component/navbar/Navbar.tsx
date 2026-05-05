import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  BarChart3,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Truck,
  History,
} from 'lucide-react';
import './Navbar.css';

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavLink[];
}

interface NavbarProps {
  logo?: string;
  onLogout?: () => void;
  userName?: string;
  userRole?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  logo = 'Warehouse',
  onLogout,
  userName = 'Manager',
  userRole = 'MANAGER',
}) => {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: NavLink[] = [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: <BarChart3 size={20} />,
    },
    {
      label: 'Gestion des stocks',
      href: '/articles',
      icon: <Package size={20} />,
      children: [
        { label: 'Articles', href: '/articles', icon: <Package size={16} /> },
        {
          label: 'Localisation',
          href: '/locations',
          icon: <Package size={16} />,
        },
        {
          label: 'Fournisseurs',
          href: '/suppliers',
          icon: <Package size={16} />,
        },
      ],
    },
    {
      label: 'Commandes',
      href: '/commands',
      icon: <Package size={20} />,
      children: [
        {
          label: 'Toutes les commandes',
          href: '/commands',
          icon: <Package size={16} />,
        },
        { label: 'Clients', href: '/clients', icon: <Package size={16} /> },
      ],
    },
    {
      label: 'Logistique',
      href: '/truck',
      icon: <Truck size={20} />,
      children: [
        { label: 'Flotte camions', href: '/truck', icon: <Truck size={16} /> },
        {
          label: 'Historique',
          href: '/truck/history',
          icon: <History size={16} />,
        },
      ],
    },
    {
      label: 'Équipe',
      href: '/users',
      icon: <Users size={20} />,
      children: [
        { label: 'Opérateurs', href: '/users', icon: <Users size={16} /> },
        {
          label: 'Affectation',
          href: '/assignments',
          icon: <Users size={16} />,
        },
      ],
    },
    {
      label: 'Paramètres',
      href: '/settings',
      icon: <Settings size={20} />,
    },
  ];

  const isActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    );
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleMenuToggle = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className='navbar__mobile-toggle'>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className='navbar__mobile-button'
          aria-label='Toggle menu'
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${isMobileMenuOpen ? 'navbar--open' : ''}`}>
        {/* Header */}
        <div className='navbar__header'>
          <div className='navbar__brand'>
            <div className='navbar__logo-icon'>W</div>
            <div className='navbar__brand-text'>
              <h1 className='navbar__brand-name'>{logo}</h1>
              <p className='navbar__brand-subtitle'>Gestion d'entrepôt</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className='navbar__user-section'>
          <div className='navbar__user-avatar'>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className='navbar__user-info'>
            <p className='navbar__user-name'>{userName}</p>
            <p className='navbar__user-role'>
              {userRole === 'MANAGER' ? 'Gestionnaire' : 'Opérateur'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <ul className='navbar__links'>
          {navLinks.map((link) => (
            <li key={link.href} className='navbar__item'>
              {link.children ? (
                <>
                  <button
                    onClick={() => handleMenuToggle(link.label)}
                    className={`navbar__link navbar__link--parent ${
                      expandedMenu === link.label
                        ? 'navbar__link--expanded'
                        : ''
                    }`}
                  >
                    <span className='navbar__link-icon'>{link.icon}</span>
                    <span className='navbar__link-label'>{link.label}</span>
                    <ChevronDown size={16} className='navbar__chevron' />
                  </button>

                  {/* Submenu */}
                  <ul
                    className={`navbar__submenu ${
                      expandedMenu === link.label ? 'navbar__submenu--open' : ''
                    }`}
                  >
                    {link.children.map((child) => (
                      <li key={child.href} className='navbar__subitem'>
                        <Link
                          to={child.href}
                          className={`navbar__sublink ${
                            isActive(child.href)
                              ? 'navbar__sublink--active'
                              : ''
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className='navbar__sublink-icon'>
                            {child.icon}
                          </span>
                          <span className='navbar__sublink-label'>
                            {child.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  to={link.href}
                  className={`navbar__link ${
                    isActive(link.href) ? 'navbar__link--active' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className='navbar__link-icon'>{link.icon}</span>
                  <span className='navbar__link-label'>{link.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className='navbar__footer'>
          <button onClick={handleLogout} className='navbar__logout'>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className='navbar__overlay'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
