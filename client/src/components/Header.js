import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-icon">🏠</span>
          <div>
            <h1 className="header-title">Rent Calculator</h1>
            <p className="header-subtitle">Tenant Billing Management — Nepal</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="badge-text">NPR</span>
        </div>
      </div>
    </header>
  );
}
