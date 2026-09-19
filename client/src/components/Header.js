import React from 'react';
import './Header.css';

export default function Header({ theme, onThemeChange }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

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
        <div className="header-tools">
          <div className="header-badge"><span className="badge-text">NPR</span></div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => onThemeChange(nextTheme)}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
