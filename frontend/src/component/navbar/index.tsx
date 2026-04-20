import React from 'react';
import { Link } from 'react-router';

interface NavbarProps {
    logo?: string;
    links?: Array<{ label: string; href: string }>;
}

const Navbar: React.FC<NavbarProps> = ({ logo = 'Logo', links = [
    { label: 'Stock Dashboard', href: '/stock' },
    { label: 'Command Dashboard', href: '/commande' },
    { label: 'Team Affectation', href: '/affectation' }
] }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <a href="/">{logo}</a>
            </div>
            <ul className="navbar-links">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link to={link.href}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;