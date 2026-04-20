import React from 'react';
import './default.css';
import Navbar from '@component/navbar';


const DefaultLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return (
        <div className="layout-container">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default DefaultLayout;